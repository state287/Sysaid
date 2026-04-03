package models

import (
	"time"

	"helpdesk/db"
)

type Ticket struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Email       string    `json:"email"`
	Subject     string    `json:"subject"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Status      string    `json:"status"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

const selectCols = `id, name, email, subject, description, category, status,
	COALESCE(notes,'') AS notes, created_at, updated_at`

func scanTicket(row interface{ Scan(...any) error }) (*Ticket, error) {
	var t Ticket
	return &t, row.Scan(
		&t.ID, &t.Name, &t.Email, &t.Subject, &t.Description,
		&t.Category, &t.Status, &t.Notes, &t.CreatedAt, &t.UpdatedAt,
	)
}

func CreateTicket(t *Ticket) error {
	return db.DB.QueryRow(`
		INSERT INTO tickets (name, email, subject, description, category, status, notes)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING `+selectCols,
		t.Name, t.Email, t.Subject, t.Description, t.Category, t.Status, t.Notes,
	).Scan(
		&t.ID, &t.Name, &t.Email, &t.Subject, &t.Description,
		&t.Category, &t.Status, &t.Notes, &t.CreatedAt, &t.UpdatedAt,
	)
}

func GetAllTickets() ([]Ticket, error) {
	rows, err := db.DB.Query(`SELECT ` + selectCols + ` FROM tickets ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Ticket
	for rows.Next() {
		t, err := scanTicket(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *t)
	}
	return list, rows.Err()
}

func GetTicketByID(id int) (*Ticket, error) {
	row := db.DB.QueryRow(`SELECT `+selectCols+` FROM tickets WHERE id=$1`, id)
	return scanTicket(row)
}

func UpdateTicket(id int, status, notes string) (*Ticket, error) {
	row := db.DB.QueryRow(`
		UPDATE tickets
		SET status=$1, notes=$2, updated_at=NOW()
		WHERE id=$3
		RETURNING `+selectCols,
		status, notes, id,
	)
	return scanTicket(row)
}
