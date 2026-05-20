package middleware

import (
	"net/http"
	"strings"

	"orbit/internal/audit"
	"orbit/internal/auth"
)

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// AuditLog writes audit entries for authenticated mutating API calls.
func AuditLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)

		if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
			return
		}
		if !strings.HasPrefix(r.URL.Path, "/api/") {
			return
		}

		user := auth.GetUser(r)
		if user == nil {
			return
		}

		audit.Log(user.Username, auth.GetClientIP(r), r.Method, r.URL.Path, rec.status)
	})
}
