package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"syscall"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/ssh/terminal"

	"orbit/internal/config"
	"orbit/internal/util"
)

func main() {
	fmt.Println("=== Orbit Setup ===\n")

	cfg := config.Config{}

	// Port
	cfg.Port = promptInt("HTTP port", 3333)

	// Admin username
	cfg.AdminUsername = promptString("Admin username", "admin")

	// Admin password
	fmt.Println("\nSet administrator password:")
	password := promptPassword("Enter password")
	confirmPassword := promptPassword("Confirm password")

	if password != confirmPassword {
		fmt.Println("Passwords do not match!")
		os.Exit(1)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Failed to hash password: %v\n", err)
		os.Exit(1)
	}
	cfg.AdminPasswordHash = string(hash)

	// Session secret
	cfg.SessionSecret = util.GenerateRandomString(64)

	// Detect IP
	detectedIP := util.DetectPrimaryIP()
	defaultURL := fmt.Sprintf("http://%s:%d", detectedIP, cfg.Port)
	cfg.PublicURL = promptString("Public URL for the panel", defaultURL)

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

	fmt.Printf("\n✓ Configuration saved to: %s\n", configPath)
	fmt.Printf("  Port: %d\n", cfg.Port)
	fmt.Printf("  Admin: %s\n", cfg.AdminUsername)
	fmt.Printf("  URL: %s\n", cfg.PublicURL)
}

func promptString(prompt, defaultValue string) string {
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

func promptPassword(prompt string) string {
	for {
		fmt.Printf("%s: ", prompt)
		password, err := terminal.ReadPassword(int(syscall.Stdin))
		fmt.Println() // newline after hidden input
		if err != nil {
			fmt.Printf("Error reading password: %v\n", err)
			continue
		}
		pwd := strings.TrimSpace(string(password))
		if pwd == "" {
			fmt.Println("Password cannot be empty. Please try again.")
			continue
		}
		return pwd
	}
}

func saveConfig(cfg *config.Config, path string) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

