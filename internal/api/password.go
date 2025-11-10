package api

import (
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"

	"orbit/internal/auth"
	"orbit/internal/config"
)

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (h *Handler) handleChangePassword(w http.ResponseWriter, r *http.Request) {
	var req changePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Get current user
	user := auth.GetUser(r)
	if user == nil {
		h.writeError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Verify current password
	if !auth.Login(user.Username, req.CurrentPassword) {
		h.writeError(w, "Current password is incorrect", http.StatusUnauthorized)
		return
	}

	// Validate new password
	if len(req.NewPassword) < 4 {
		h.writeError(w, "New password must be at least 4 characters", http.StatusBadRequest)
		return
	}

	// Hash new password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		h.writeError(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Update config
	cfg, err := config.Load("/etc/orbit/config.json")
	if err != nil {
		h.writeError(w, "Failed to load config", http.StatusInternalServerError)
		return
	}

	cfg.AdminPasswordHash = string(hash)
	cfg.FirstLogin = false // Clear first login flag

	// Save config
	if err := config.Save(cfg, "/etc/orbit/config.json"); err != nil {
		h.writeError(w, "Failed to save config", http.StatusInternalServerError)
		return
	}

	// Reinitialize auth with new config
	auth.Init(cfg)

	h.writeJSON(w, map[string]interface{}{
		"success": true,
		"message": "Password changed successfully",
	})
}

func (h *Handler) handleCheckFirstLogin(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.Load("/etc/orbit/config.json")
	if err != nil {
		h.writeError(w, "Failed to load config", http.StatusInternalServerError)
		return
	}

	h.writeJSON(w, map[string]interface{}{
		"first_login": cfg.FirstLogin,
	})
}

