package api

import (
	"encoding/json"
	"net/http"

	"orbit/internal/auth"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *Handler) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if !auth.Login(req.Username, req.Password) {
		h.writeError(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if err := auth.SetUser(r, w, req.Username); err != nil {
		h.writeError(w, "Session error", http.StatusInternalServerError)
		return
	}

	h.writeJSON(w, map[string]interface{}{
		"success": true,
		"user":    map[string]string{"username": req.Username},
	})
}

func (h *Handler) handleLogout(w http.ResponseWriter, r *http.Request) {
	auth.Logout(r, w)
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleSession(w http.ResponseWriter, r *http.Request) {
	if !auth.IsAuthenticated(r) {
		h.writeJSON(w, map[string]interface{}{
			"authenticated": false,
		})
		return
	}

	user := auth.GetUser(r)
	h.writeJSON(w, map[string]interface{}{
		"authenticated": true,
		"user":          map[string]string{"username": user.Username},
	})
}

