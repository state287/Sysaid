# Helpdesk Ticketing System

A full-stack helpdesk ticketing system with a React user portal, Go REST API, PostgreSQL, Mailgun email integration, and Caddy reverse proxy with automatic HTTPS.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router v6 |
| Backend | Go 1.21 (gorilla/mux) |
| Database | PostgreSQL 16 |
| Email | Mailgun (inbound + outbound) |
| Reverse Proxy | Caddy 2 (auto HTTPS) |
| Deployment | Docker Compose |

---

## Project Structure

```
/
├── docker-compose.yml
├── Caddyfile
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── main.go
│   ├── db/db.go            # connection + migrations
│   ├── models/ticket.go    # data access layer
│   └── routes/
│       ├── tickets.go      # REST handlers
│       ├── email.go        # inbound webhook handler
│       └── email_service.go# Mailgun send helpers
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.jsx
        ├── index.css
        ├── pages/
        │   ├── UserPortal.jsx      # / — submit a ticket
        │   ├── TicketStatus.jsx    # /ticket/:id — check status
        │   └── AdminDashboard.jsx  # /admin — manage tickets
        └── components/
            └── StatusBadge.jsx
```

---

## Quick Start

### 1. Clone & configure

```bash
git clone <repo-url>
cd helpdesk
cp .env.example .env
# Edit .env with your values (see Configuration section below)
```

### 2. Launch with Docker Compose

```bash
docker compose up --build -d
```

The app will be available at:

- **User portal:** `http://localhost` (or `https://yourdomain.com`)
- **Admin dashboard:** `http://localhost/admin`
- **API health check:** `http://localhost/api/health`

### 3. View logs

```bash
docker compose logs -f backend
docker compose logs -f caddy
```

### 4. Stop

```bash
docker compose down
# To also remove the database volume:
docker compose down -v
```

---

## Configuration

Copy `.env.example` to `.env` and fill in each value:

| Variable | Description |
|---|---|
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_NAME` | PostgreSQL database name |
| `ADMIN_PASSWORD` | Password for the `/admin` dashboard |
| `MAILGUN_API_KEY` | Mailgun private API key |
| `MAILGUN_DOMAIN` | Your Mailgun sending domain (e.g. `mg.example.com`) |
| `MAILGUN_FROM_EMAIL` | From address for outbound emails |
| `APP_URL` | Public URL of your deployment (used in email links) |
| `DOMAIN` | Domain for Caddy auto-HTTPS (set to `localhost` for local dev) |

### Mailgun EU region

If your Mailgun account is on the EU region, uncomment the following line in `backend/routes/email_service.go`:

```go
// mg.SetAPIBase(mailgun.APIBaseEU)
```

---

## Mailgun Setup

### Outbound emails

1. Log in to [mailgun.com](https://mailgun.com) and add/verify your sending domain.
2. Copy your **Private API Key** from **Settings → API Keys**.
3. Add an authorised sender address that matches `MAILGUN_FROM_EMAIL`.

### Inbound email-to-ticket

Mailgun can forward incoming emails to the `/api/email/inbound` webhook:

1. In the Mailgun dashboard go to **Receiving → Create Route**.
2. Set the **Filter Expression** to match your inbound address, e.g.:
   ```
   match_recipient("support@mg.yourdomain.com")
   ```
3. Set the **Action** to **Forward** with the URL:
   ```
   https://yourdomain.com/api/email/inbound
   ```
4. Save the route.

Any email sent to `support@mg.yourdomain.com` will now automatically create a helpdesk ticket and send a confirmation reply to the sender.

> **Note:** For production use, add Mailgun webhook signature verification to `backend/routes/email.go` to prevent spoofed requests.

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check |
| `POST` | `/api/tickets` | — | Create a ticket |
| `GET` | `/api/tickets` | Admin | List all tickets |
| `GET` | `/api/tickets/:id` | — | Get a single ticket |
| `PATCH` | `/api/tickets/:id` | Admin | Update status / notes |
| `POST` | `/api/email/inbound` | Mailgun | Inbound email webhook |

Admin endpoints require the HTTP header:

```
Authorization: Bearer <ADMIN_PASSWORD>
```

### Create ticket (POST /api/tickets)

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "subject": "Laptop won't turn on",
  "description": "Detailed description of the issue…",
  "category": "Hardware"
}
```

Categories: `Hardware`, `Software`, `Network`, `Other`

### Update ticket (PATCH /api/tickets/:id)

```json
{
  "status": "In Progress",
  "notes": "Assigned to tech team, escalated."
}
```

Statuses: `Open`, `In Progress`, `Resolved`, `Closed`

Both fields are optional; omit a field to leave it unchanged.

---

## Local Development (without Docker)

### Backend

```bash
cd backend
go mod tidy
# Set env vars or create a local .env file
export DB_HOST=localhost DB_PORT=5432 DB_USER=helpdesk \
       DB_PASSWORD=helpdesk DB_NAME=helpdesk \
       ADMIN_PASSWORD=admin MAILGUN_API_KEY='' MAILGUN_DOMAIN=''
go run .
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Proxies /api/* to http://localhost:8080 automatically (see vite.config.js)
```

---

## Database Schema

```sql
CREATE TABLE tickets (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255)             NOT NULL,
    email       VARCHAR(255)             NOT NULL,
    subject     VARCHAR(500)             NOT NULL,
    description TEXT                     NOT NULL,
    category    VARCHAR(50)              NOT NULL DEFAULT 'Other',
    status      VARCHAR(50)              NOT NULL DEFAULT 'Open',
    notes       TEXT                     NOT NULL DEFAULT '',
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

The schema is applied automatically on backend startup via `db.Migrate()`.

---

## Features

- **User portal** — submit tickets with name, email, subject, description, and category
- **Status page** — look up any ticket by ID; shows status, category, date, and admin notes
- **Admin dashboard** — password-protected; filter by status, view full details, update status, add notes
- **Email-to-ticket** — Mailgun inbound webhook auto-creates tickets from incoming email
- **Confirmation emails** — sent on ticket creation (web form and email)
- **Status update emails** — sent whenever an admin changes the ticket status
- **Auto HTTPS** — Caddy automatically provisions TLS certificates for your domain
