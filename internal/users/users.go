package users

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"

	"orbit/internal/util"
)

type User struct {
	Username string `json:"username"`
	UID      string `json:"uid"`
	GID      string `json:"gid"`
	Home     string `json:"home"`
	Shell    string `json:"shell"`
	Locked   bool   `json:"locked"`
}

func List() ([]User, error) {
	output, err := util.RunCommandNoSudo("getent", "passwd")
	if err != nil {
		return nil, err
	}

	var users []User
	for _, line := range strings.Split(strings.TrimSpace(output), "\n") {
		if line == "" {
			continue
		}
		parts := strings.Split(line, ":")
		if len(parts) >= 7 {
			username := parts[0]
			locked := isUserLocked(username)
			users = append(users, User{
				Username: username,
				UID:      parts[2],
				GID:      parts[3],
				Home:     parts[5],
				Shell:    parts[6],
				Locked:   locked,
			})
		}
	}
	return users, nil
}

func isUserLocked(username string) bool {
	// BUG FIX #4: Validate username before checking lock status
	if !isValidUsername(username) {
		return false
	}
	output, err := util.RunCommand("passwd", "-S", username)
	if err != nil {
		// If command fails, assume not locked (user might not exist)
		return false
	}
	// Output format: "username L ..." means locked, "username P ..." means password set
	return strings.Contains(output, " L ")
}

func Create(username, password string) error {
	// Validate username to prevent injection
	if !isValidUsername(username) {
		return fmt.Errorf("invalid username: %s", username)
	}
	
	// Create user
	_, err := util.RunCommand("useradd", "-m", "-s", "/bin/bash", username)
	if err != nil {
		return err
	}

	// BUG FIX: Set password via stdin pipe
	if password != "" {
		cmd := exec.Command("sudo", "-n", "chpasswd")
		cmd.Stdin = bytes.NewBufferString(username + ":" + password)
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("failed to set password: %v", err)
		}
	}

	return nil
}

func Delete(username string) error {
	// Validate username to prevent injection
	if !isValidUsername(username) {
		return fmt.Errorf("invalid username: %s", username)
	}
	output, err := util.RunCommand("userdel", "-r", username)
	if err != nil {
		// userdel exit status 8 usually means "user is currently logged in"
		if strings.Contains(output, "currently logged in") {
			return fmt.Errorf("cannot delete user %s: user is currently logged in", username)
		}
		return fmt.Errorf("failed to delete user %s: %v", username, err)
	}
	return nil
}

func Lock(username string) error {
	// Validate username to prevent injection
	if !isValidUsername(username) {
		return fmt.Errorf("invalid username: %s", username)
	}
	_, err := util.RunCommand("usermod", "-L", username)
	return err
}

func Unlock(username string) error {
	// Validate username to prevent injection
	if !isValidUsername(username) {
		return fmt.Errorf("invalid username: %s", username)
	}
	_, err := util.RunCommand("usermod", "-U", username)
	return err
}

func ChangePassword(username, password string) error {
	// Validate username to prevent injection
	if !isValidUsername(username) {
		return fmt.Errorf("invalid username: %s", username)
	}
	
	// Set password via stdin pipe
	cmd := exec.Command("sudo", "-n", "chpasswd")
	cmd.Stdin = bytes.NewBufferString(username + ":" + password)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to change password: %v", err)
	}
	return nil
}

// isValidUsername validates usernames to prevent command injection
func isValidUsername(username string) bool {
	if username == "" || len(username) > 32 {
		return false
	}
	// Allow alphanumeric, dash, underscore (lowercase only for Linux)
	// First character must be a letter or underscore
	if !((username[0] >= 'a' && username[0] <= 'z') || username[0] == '_') {
		return false
	}
	for _, c := range username {
		if !((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' || c == '_') {
			return false
		}
	}
	return true
}

