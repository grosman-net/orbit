package middleware

import (
	"net/http"
	"strings"

	"orbit/internal/auth"
)

var csrfExemptPaths = map[string]bool{
	"/api/auth/login": true,
}

// CSRF validates the CSRF token on state-changing API requests.
func CSRF(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		if !strings.HasPrefix(r.URL.Path, "/api/") {
			next.ServeHTTP(w, r)
			return
		}

		if csrfExemptPaths[r.URL.Path] {
			next.ServeHTTP(w, r)
			return
		}

		token := r.Header.Get("X-CSRF-Token")
		if token == "" {
			http.Error(w, `{"error":"Missing CSRF token"}`, http.StatusForbidden)
			return
		}

		if !auth.ValidateCSRFToken(r, token) {
			http.Error(w, `{"error":"Invalid CSRF token"}`, http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}
