package api

import (
	"encoding/json"
	"net/http"

	"orbit/internal/network"
)

func (h *Handler) handleNetwork(w http.ResponseWriter, r *http.Request) {
	info, err := network.GetInfo()
	if err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, info)
}

func (h *Handler) handleFirewallEnable(w http.ResponseWriter, r *http.Request) {
	if err := network.EnableFirewall(); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleFirewallDisable(w http.ResponseWriter, r *http.Request) {
	if err := network.DisableFirewall(); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleFirewallAllow(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Port     string `json:"port"`
		Protocol string `json:"protocol"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := network.AllowPort(req.Port, req.Protocol); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleFirewallDeny(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Port     string `json:"port"`
		Protocol string `json:"protocol"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := network.DenyPort(req.Port, req.Protocol); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleFirewallDelete(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Rule string `json:"rule"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := network.DeleteRule(req.Rule); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

