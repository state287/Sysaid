package routes

import (
	"encoding/json"
	"net/http"
	"net/mail"

	"helpdesk/models"

	"github.com/gorilla/mux"
)

func RegisterEmailRoutes(r *mux.Router) {
	r.HandleFunc("/email/inbound", handleInboundEmail).Methods("POST")
}

func handleInboundEmail(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		// fall back to regular form
		if err2 := r.ParseForm(); err2 != nil {
			http.Error(w, "cannot parse form", http.StatusBadRequest)
			return
		}
	}

	sender := r.FormValue("sender")
	fromHeader := r.FormValue("From")
	subject := r.FormValue("subject")
	body := r.FormValue("body-plain")

	if sender == "" {
		sender = fromHeader
	}
	if sender == "" || subject == "" {
		http.Error(w, "sender and subject are required", http.StatusBadRequest)
		return
	}

	// Extract display name from "Name <email>" if present
	name := sender
	if addr, err := mail.ParseAddress(fromHeader); err == nil {
		if addr.Name != "" {
			name = addr.Name
		} else {
			name = addr.Address
		}
		sender = addr.Address
	}

	if body == "" {
		body = r.FormValue("body-html")
	}
	if body == "" {
		body = "(No message body)"
	}

	t := &models.Ticket{
		Name:        name,
		Email:       sender,
		Subject:     subject,
		Description: body,
		Category:    "Other",
		Status:      "Open",
		Notes:       "",
	}
	if err := models.CreateTicket(t); err != nil {
		http.Error(w, "failed to create ticket", http.StatusInternalServerError)
		return
	}

	go sendConfirmationEmail(t)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"ticket_id": t.ID, "message": "ticket created"})
}
