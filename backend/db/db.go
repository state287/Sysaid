package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getenv("DB_HOST", "localhost"),
		getenv("DB_PORT", "5432"),
		getenv("DB_USER", "helpdesk"),
		getenv("DB_PASSWORD", "helpdesk"),
		getenv("DB_NAME", "helpdesk"),
	)

	var err error
	for i := 1; i <= 12; i++ {
		DB, err = sql.Open("postgres", dsn)
		if err == nil {
			if err = DB.Ping(); err == nil {
				log.Println("Connected to database")
				return
			}
		}
		log.Printf("DB not ready (attempt %d/12), retrying in 5s…", i)
		time.Sleep(5 * time.Second)
	}
	log.Fatalf("Could not connect to database: %v", err)
}

func Migrate() {
	query := `
	CREATE TABLE IF NOT EXISTS tickets (
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
	);`

	if _, err := DB.Exec(query); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	log.Println("Migrations applied")
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
