package main

import (
	"log"
	"net/http"
	"os"

	"helpdesk/db"
	"helpdesk/routes"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	// Load .env file if present (ignored in Docker, env vars come from compose)
	_ = godotenv.Load()

	// Connect to DB with retry
	db.Connect()
	defer db.DB.Close()

	// Run schema migrations
	db.Migrate()

	// Setup router
	r := mux.NewRouter()

	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods("GET")

	routes.RegisterTicketRoutes(api)
	routes.RegisterEmailRoutes(api)

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PATCH", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, c.Handler(r)))
}
