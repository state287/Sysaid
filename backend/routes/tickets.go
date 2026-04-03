package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"

	"helpdesk/models"

	"github.com/gorilla/mux"
)

func RegisterTicketRoutes(r *mux.Router) {
	r.HandleFunc("/tickets", createTicket).Methods("POST")
	r.HandleFunc("/tickets", listTickets).Methods("GET")
	r.HandleFunc("/tickets/{id}", getTicket).Methods("GET")
	r.HandleFunc("/tickets/{id}", updateTicket).Methods("PATCH")
}

var validCategories = map[string]bool{
	"Hardware": true, "Software": true, "Network": true, "Other": true,
}
var validStatuses = map[string]bool{
	"Open": true, "In Progress": true, "Resolved": true, "Closed": true,
}

// ── helpers ──────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func isAdmin(r *http.Request) bool {
	pass := os.Getenv("ADMIN_PASSWORD")
	auth := r.Header.Get("Authorization")
	return pass != "" && auth == "Bearer "+pass
}

// ── handlers ─────────────────────────────────────────────────────────────────

func createTicket(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		Subject     string `json:"subject"`
		Description string `json:"description"`
		Category    string `json:"category"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.TrimSpace(in.Email)
	in.Subject = strings.TrimSpace(in.Subject)
	in.Description = strings.TrimSpace(in.Description)

	if in.Name == "" || in.Email == "" || in.Subject == "" || in.Description == "" {
		http.Error(w, "name, email, subject, and description are required", http.StatusBadRequest)
		return
	}
	if !validCategories[in.Category] {
		in.Category = "Other"
	}

	t := &models.Ticket{
		Name:        in.Name,
		Email:       in.Email,
		Subject:     in.Subject,
		Description: in.Description,
		Category:    in.Category,
		Status:      "Open",
		Notes:       "",
	}
	if err := models.CreateTicket(t); err != nil {
		http.Error(w, "failed to create ticket", http.StatusInternalServerError)
		return
	}

	go sendConfirmationEmail(t)

	writeJSON(w, http.StatusCreated, t)
}

func listTickets(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(r) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	tickets, err := models.GetAllTickets()
	if err != nil {
		http.Error(w, "failed to fetch tickets", http.StatusInternalServerError)
		return
	}
	if tickets == nil {
		tickets = []models.Ticket{}
	}
	writeJSON(w, http.StatusOK, tickets)
}

func getTicket(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "invalid ticket id", http.StatusBadRequest)
		return
	}

	t, err := models.GetTicketByID(id)
	if err == sql.ErrNoRows {
		http.Error(w, "ticket not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "failed to fetch ticket", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func updateTicket(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(r) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "invalid ticket id", http.StatusBadRequest)
		return
	}

	var in struct {
		Status *string `json:"status"`
		Notes  *string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	current, err := models.GetTicketByID(id)
	if err == sql.ErrNoRows {
		http.Error(w, "ticket not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "failed to fetch ticket", http.StatusInternalServerError)
		return
	}

	newStatus := current.Status
	newNotes := current.Notes

	if in.Status != nil {
		if !validStatuses[*in.Status] {
			http.Error(w, "invalid status", http.StatusBadRequest)
			return
		}
		newStatus = *in.Status
	}
	if in.Notes != nil {
		newNotes = *in.Notes
	}

	updated, err := models.UpdateTicket(id, newStatus, newNotes)
	if err != nil {
		http.Error(w, "failed to update ticket", http.StatusInternalServerError)
		return
	}

	// Notify requester if status changed
	if in.Status != nil && *in.Status != current.Status {
		go sendStatusUpdateEmail(updated)
	}

	writeJSON(w, http.StatusOK, updated)
}
