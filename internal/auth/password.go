package auth

import (
	"errors"
	"strings"
	"unicode"
)

const MinPasswordLength = 12

// ValidatePassword enforces admin password policy.
func ValidatePassword(password, username string) error {
	if len(password) < MinPasswordLength {
		return errors.New("password must be at least 12 characters")
	}
	if strings.EqualFold(password, username) {
		return errors.New("password must not match the username")
	}

	var hasLower, hasUpper, hasDigit bool
	for _, c := range password {
		switch {
		case unicode.IsLower(c):
			hasLower = true
		case unicode.IsUpper(c):
			hasUpper = true
		case unicode.IsDigit(c):
			hasDigit = true
		}
	}
	if !hasLower || !hasUpper || !hasDigit {
		return errors.New("password must include uppercase, lowercase, and a digit")
	}
	return nil
}
