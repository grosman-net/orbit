package main

import (
	"embed"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"orbit/internal/api"
	"orbit/internal/auth"
	"orbit/internal/config"
	"orbit/internal/middleware"
)

const Version = "1.2.1"

//go:embed web/*
var webFS embed.FS

func main() {
	// Parse command-line flags
	port := flag.Int("port", 0, "HTTP port to listen on (overrides config)")
	configPath := flag.String("config", "/etc/orbit/config.json", "Path to configuration file")
	flag.Parse()

	// Load configuration
	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("ERROR: Could not load config from %s: %v\nRun 'orbit-setup' to create configuration.", *configPath, err)
	}

	// Override port if specified via flag
	if *port > 0 {
		cfg.Port = *port
	}

	// Initialize auth
	auth.Init(cfg)

	handler := middleware.SecurityHeaders(
		middleware.CSRF(
			middleware.AuditLog(
				api.NewHandler(webFS, cfg),
			),
		),
	)

	addr := net.JoinHostPort(cfg.BindAddress, fmt.Sprintf("%d", cfg.Port))

	log.Printf("Starting Orbit %s", Version)
	if cfg.TLSCert != "" && cfg.TLSKey != "" {
		log.Printf("Listening on https://%s", addr)
	} else {
		log.Printf("Listening on http://%s (use a reverse proxy with TLS for production)", addr)
	}
	log.Printf("Press Ctrl+C to stop")

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		var err error
		if cfg.TLSCert != "" && cfg.TLSKey != "" {
			err = http.ListenAndServeTLS(addr, cfg.TLSCert, cfg.TLSKey, handler)
		} else {
			err = http.ListenAndServe(addr, handler)
		}
		if err != nil {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	<-stop
	log.Println("\nShutting down gracefully...")
}

