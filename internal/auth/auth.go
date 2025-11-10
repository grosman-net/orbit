package auth

import (
	"encoding/gob"
	"net/http"

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
	store = sessions.NewCookieStore([]byte(cfg.SessionSecret))
	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // 7 days
		HttpOnly: true,
		Secure:   false, // Set to true if using HTTPS
		SameSite: http.SameSiteLaxMode,
	}
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
	return store.Get(r, "orbit-session")
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

