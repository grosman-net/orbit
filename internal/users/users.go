package users

import (
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
	output, err := util.RunCommand("passwd", "-S", username)
	if err != nil {
		return false
	}
	// Output format: "username L ..." means locked
	return strings.Contains(output, " L ")
}

func Create(username, password string) error {
	// Create user
	_, err := util.RunCommand("useradd", "-m", "-s", "/bin/bash", username)
	if err != nil {
		return err
	}

	// Set password
	if password != "" {
		_, err = util.RunCommand("chpasswd")
		// TODO: pipe password through stdin
	}

	return err
}

func Delete(username string) error {
	_, err := util.RunCommand("userdel", "-r", username)
	return err
}

func Lock(username string) error {
	_, err := util.RunCommand("usermod", "-L", username)
	return err
}

func Unlock(username string) error {
	_, err := util.RunCommand("usermod", "-U", username)
	return err
}

func ChangePassword(username, password string) error {
	// TODO: implement password change via stdin pipe
	return nil
}

