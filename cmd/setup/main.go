package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"orbit/internal/config"
	"orbit/internal/util"
)

func main() {
	fmt.Println("=== Orbit Setup ===\n")

	cfg := config.Config{}

	// Port
	cfg.Port = promptInt("HTTP port", 3333)

	// Admin username with automatic password
	cfg.AdminUsername = promptStringOrDefault("Admin username (password will be same as username)", "admin")
	password := cfg.AdminUsername // Username = Password by default

	fmt.Printf("✓ Username: %s (default password: %s)\n", cfg.AdminUsername, cfg.AdminUsername)
	fmt.Println("  You can change the password after first login via web panel")

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Failed to hash password: %v\n", err)
		os.Exit(1)
	}
	cfg.AdminPasswordHash = string(hash)

	// Session secret
	cfg.SessionSecret = util.GenerateRandomString(64)

	// Detect IP automatically
	detectedIP := util.DetectPrimaryIP()
	cfg.PublicURL = fmt.Sprintf("http://%s:%d", detectedIP, cfg.Port)
	
	// Set first login flag
	cfg.FirstLogin = true

	// Ensure config directory exists
	configDir := "/etc/orbit"
	if err := os.MkdirAll(configDir, 0755); err != nil {
		fmt.Printf("Warning: Could not create %s: %v\n", configDir, err)
		fmt.Println("Saving to local config.json instead")
		configPath := "config.json"
		if err := saveConfig(&cfg, configPath); err != nil {
			fmt.Printf("Failed to save config: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("\nConfiguration saved to: %s\n", configPath)
		fmt.Println("Move it to /etc/orbit/config.json with sudo if needed.")
		return
	}

	configPath := "/etc/orbit/config.json"
	if err := saveConfig(&cfg, configPath); err != nil {
		fmt.Printf("Failed to save config: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("\n✅ Configuration saved!\n\n")
	fmt.Printf("═══════════════════════════════════════════\n")
	fmt.Printf("  Panel URL: %s\n", cfg.PublicURL)
	fmt.Printf("  Username:  %s\n", cfg.AdminUsername)
	fmt.Printf("  Password:  %s (change after first login)\n", cfg.AdminUsername)
	fmt.Printf("═══════════════════════════════════════════\n")
}

func promptStringOrDefault(prompt, defaultValue string) string {
	reader := bufio.NewReader(os.Stdin)
	fmt.Printf("%s [%s]: ", prompt, defaultValue)
	input, _ := reader.ReadString('\n')
	input = strings.TrimSpace(input)
	if input == "" {
		return defaultValue
	}
	return input
}

func promptInt(prompt string, defaultValue int) int {
	reader := bufio.NewReader(os.Stdin)
	for {
		fmt.Printf("%s [%d]: ", prompt, defaultValue)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		if input == "" {
			return defaultValue
		}
		val, err := strconv.Atoi(input)
		if err != nil || val <= 0 || val > 65535 {
			fmt.Println("Invalid port number. Please enter a number between 1 and 65535.")
			continue
		}
		return val
	}
}

func saveConfig(cfg *config.Config, path string) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

