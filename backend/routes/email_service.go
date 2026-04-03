package routes

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"helpdesk/models"

	mailgun "github.com/mailgun/mailgun-go/v4"
)

func mgClient() *mailgun.MailgunImpl {
	mg := mailgun.NewMailgun(os.Getenv("MAILGUN_DOMAIN"), os.Getenv("MAILGUN_API_KEY"))
	// Uncomment for EU region:
	// mg.SetAPIBase(mailgun.APIBaseEU)
	return mg
}

func fromAddress() string {
	if v := os.Getenv("MAILGUN_FROM_EMAIL"); v != "" {
		return v
	}
	return "helpdesk@" + os.Getenv("MAILGUN_DOMAIN")
}

func sendMail(to, subject, body string) {
	if os.Getenv("MAILGUN_API_KEY") == "" {
		log.Printf("[email] MAILGUN_API_KEY not set – skipping email to %s", to)
		return
	}

	mg := mgClient()
	msg := mg.NewMessage(fromAddress(), subject, body, to)

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	_, _, err := mg.Send(ctx, msg)
	if err != nil {
		log.Printf("[email] send failed to %s: %v", to, err)
	} else {
		log.Printf("[email] sent '%s' to %s", subject, to)
	}
}

func appURL() string {
	if v := os.Getenv("APP_URL"); v != "" {
		return v
	}
	return "http://localhost"
}

func sendConfirmationEmail(t *models.Ticket) {
	subject := fmt.Sprintf("[Ticket #%d] We received your request: %s", t.ID, t.Subject)
	body := fmt.Sprintf(`Hello %s,

Thank you for contacting our helpdesk. Your ticket has been created.

─────────────────────────────
Ticket ID : #%d
Subject   : %s
Category  : %s
Status    : %s
Created   : %s
─────────────────────────────

You can track your ticket at:
%s/ticket/%d

Our team will respond as soon as possible.

Best regards,
Helpdesk Team`,
		t.Name,
		t.ID,
		t.Subject,
		t.Category,
		t.Status,
		t.CreatedAt.Format("Jan 02, 2006 15:04 MST"),
		appURL(), t.ID,
	)
	sendMail(t.Email, subject, body)
}

func sendStatusUpdateEmail(t *models.Ticket) {
	subject := fmt.Sprintf("[Ticket #%d] Status update: %s", t.ID, t.Status)

	notes := ""
	if t.Notes != "" {
		notes = "\nAdmin notes:\n" + t.Notes + "\n"
	}

	body := fmt.Sprintf(`Hello %s,

Your helpdesk ticket status has been updated.

─────────────────────────────
Ticket ID  : #%d
Subject    : %s
New Status : %s
Updated    : %s
─────────────────────────────
%s
View your ticket at:
%s/ticket/%d

Best regards,
Helpdesk Team`,
		t.Name,
		t.ID,
		t.Subject,
		t.Status,
		t.UpdatedAt.Format("Jan 02, 2006 15:04 MST"),
		notes,
		appURL(), t.ID,
	)
	sendMail(t.Email, subject, body)
}
