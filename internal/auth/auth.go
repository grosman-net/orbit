package auth

import (
	"encoding/gob"
	"net/http"
	"net/url"

	"github.com/gorilla/sessions"
	"golang.org/x/crypto/bcrypt"

	"orbit/internal/config"
	"orbit/internal/util"
)

var (
	cfg             *config.Config
	store           *sessions.CookieStore
	trustedProxies  []string
)

type User struct {
	Username string
}

func init() {
	gob.Register(&User{})
}

func Init(c *config.Config) {
	cfg = c

	trustedProxies = cfg.TrustedProxies
	if len(trustedProxies) == 0 {
		trustedProxies = []string{"127.0.0.1", "::1"}
	}

	secret := []byte(cfg.SessionSecret)
	if len(secret) < 32 {
		panic("session_secret must be at least 32 characters; run orbit-setup to regenerate")
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
	// Rotate session on login to limit fixation risk.
	old, _ := GetSession(r)
	old.Values["user"] = nil
	old.Options.MaxAge = -1
	_ = old.Save(r, w)

	session, err := store.New(r, "orbit-session")
	if err != nil {
		return err
	}
	session.Values["user"] = &User{Username: username}
	session.Values["csrf_token"] = util.GenerateRandomString(32)
	return session.Save(r, w)
}

// GetCSRFToken returns the CSRF token for the current session.
func GetCSRFToken(r *http.Request) string {
	session, err := GetSession(r)
	if err != nil {
		return ""
	}
	if token, ok := session.Values["csrf_token"].(string); ok {
		return token
	}
	return ""
}

// ValidateCSRFToken checks the request CSRF token against the session.
func ValidateCSRFToken(r *http.Request, token string) bool {
	expected := GetCSRFToken(r)
	return expected != "" && expected == token
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
