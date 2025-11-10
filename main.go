package main

import (
	"embed"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"orbit/internal/api"
	"orbit/internal/auth"
	"orbit/internal/config"
)

//go:embed web/*
var webFS embed.FS

func main() {
	// Parse command-line flags
	port := flag.Int("port", 3333, "HTTP port to listen on")
	configPath := flag.String("config", "/etc/orbit/config.json", "Path to configuration file")
	flag.Parse()

	// Load configuration
	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Printf("Warning: Could not load config from %s: %v", *configPath, err)
		log.Printf("Using defaults. Run 'orbit setup' to configure.")
		cfg = config.Default()
	}

	// Override port if specified
	if *port != 3333 {
		cfg.Port = *port
	}

	// Initialize auth
	auth.Init(cfg)

	// Setup HTTP server
	handler := api.NewHandler(webFS, cfg)
	addr := fmt.Sprintf(":%d", cfg.Port)

	log.Printf("Starting Orbit Server Management Panel")
	log.Printf("Listening on http://0.0.0.0:%d", cfg.Port)
	log.Printf("Press Ctrl+C to stop")

	// Graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := http.ListenAndServe(addr, handler); err != nil {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	<-stop
	log.Println("\nShutting down gracefully...")
}

