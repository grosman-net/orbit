package auth

import (
	"encoding/gob"
	"net/http"
	"net/url"

	"github.com/gorilla/sessions"
	"golang.org/x/crypto/bcrypt"

	"orbit/internal/config"
)

var (
	cfg   *config.Config
	store *sessions.CookieStore
)

type User struct {
	Username string
}

func init() {
	gob.Register(&User{})
}

func Init(c *config.Config) {
	cfg = c

	// Ensure session secret is at least 32 bytes for security
	secret := []byte(cfg.SessionSecret)
	if len(secret) < 32 {
		// Pad with zeros if too short (shouldn't happen with proper setup)
		padded := make([]byte, 32)
		copy(padded, secret)
		secret = padded
	}

	store = sessions.NewCookieStore(secret)

	// Decide whether to mark cookie as Secure based on configured public URL.
	secureCookie := false
	if cfg.PublicURL != "" {
		if u, err := url.Parse(cfg.PublicURL); err == nil && u.Scheme == "https" {
			secureCookie = true
		}
	}

	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // 7 days
		HttpOnly: true,
		Secure:   secureCookie,
		SameSite: http.SameSiteLaxMode,
	}

	// Start cleanup goroutine for rate limiting
	CleanupOldAttempts()
}

func Login(username, password string) bool {
	if cfg.AdminUsername == "" || cfg.AdminPasswordHash == "" {
		return false
	}
	if username != cfg.AdminUsername {
		return false
	}
	err := bcrypt.CompareHashAndPassword([]byte(cfg.AdminPasswordHash), []byte(password))
	return err == nil
}

func GetSession(r *http.Request) (*sessions.Session, error) {
	// BUG FIX #3: Gracefully handle invalid sessions due to secret change
	session, err := store.Get(r, "orbit-session")
	if err != nil {
		// Session decode failed (likely due to secret change on reinstall)
		// Return new empty session instead of error
		session, _ = store.New(r, "orbit-session")
		return session, nil
	}
	return session, nil
}

func IsAuthenticated(r *http.Request) bool {
	session, err := GetSession(r)
	if err != nil {
		return false
	}
	user, ok := session.Values["user"].(*User)
	return ok && user != nil && user.Username != ""
}

func GetUser(r *http.Request) *User {
	session, err := GetSession(r)
	if err != nil {
		return nil
	}
	user, ok := session.Values["user"].(*User)
	if !ok {
		return nil
	}
	return user
}

func SetUser(r *http.Request, w http.ResponseWriter, username string) error {
	session, err := GetSession(r)
	if err != nil {
		return err
	}
	session.Values["user"] = &User{Username: username}
	return session.Save(r, w)
}

func Logout(r *http.Request, w http.ResponseWriter) error {
	session, err := GetSession(r)
	if err != nil {
		return err
	}
	session.Values["user"] = nil
	session.Options.MaxAge = -1
	return session.Save(r, w)
}

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !IsAuthenticated(r) {
			http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}
