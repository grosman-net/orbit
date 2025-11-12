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


// Interface management
func (h *Handler) handleInterfaceUp(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Interface string `json:"interface"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := network.SetInterfaceUp(req.Interface); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleInterfaceDown(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Interface string `json:"interface"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := network.SetInterfaceDown(req.Interface); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleInterfaceSetIP(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Interface string `json:"interface"`
		Address   string `json:"address"`
		Gateway   string `json:"gateway"`
		Persistent bool  `json:"persistent"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Add IP address
	if err := network.AddIPAddress(req.Interface, req.Address); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Save to netplan if persistent
	if req.Persistent {
		if err := network.SaveInterfaceConfig(req.Interface, req.Address, req.Gateway); err != nil {
			h.writeError(w, "Failed to save persistent config: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	h.writeJSON(w, map[string]bool{"success": true})
}

// Route management
func (h *Handler) handleRouteAdd(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Destination string `json:"destination"`
		Gateway     string `json:"gateway"`
		Interface   string `json:"interface"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := network.AddRoute(req.Destination, req.Gateway, req.Interface); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleRouteDelete(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Destination string `json:"destination"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := network.DeleteRoute(req.Destination); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

// Interface add/delete
func (h *Handler) handleInterfaceAdd(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string `json:"name"`
		Type string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := network.AddVirtualInterface(req.Name, req.Type); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleInterfaceDelete(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Interface string `json:"interface"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := network.DeleteInterface(req.Interface); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}
