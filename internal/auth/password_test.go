package auth

import "testing"

func TestValidatePassword(t *testing.T) {
	if err := ValidatePassword("Short1a", "admin"); err == nil {
		t.Fatal("expected short password to fail")
	}
	if err := ValidatePassword("admin", "admin"); err == nil {
		t.Fatal("expected password matching username to fail")
	}
	if err := ValidatePassword("lowercase12345", "admin"); err == nil {
		t.Fatal("expected missing uppercase to fail")
	}
	if err := ValidatePassword("SecurePass99", "admin"); err != nil {
		t.Fatalf("expected valid password, got: %v", err)
	}
}
