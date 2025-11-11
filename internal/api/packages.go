package api

import (
	"encoding/json"
	"net/http"
	"orbit/internal/packages"
)

func (h *Handler) handlePackages(w http.ResponseWriter, r *http.Request) {
	pkgs, err := packages.List()
	if err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, pkgs)
}

func (h *Handler) handlePackagesSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		h.writeError(w, "Missing query parameter", http.StatusBadRequest)
		return
	}

	results, err := packages.Search(query)
	if err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, results)
}

func (h *Handler) handlePackagesInstall(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Package string `json:"package"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := packages.Install(req.Package); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handlePackagesRemove(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Package string `json:"package"`
		Purge   bool   `json:"purge"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := packages.Remove(req.Package, req.Purge); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handlePackagesUpdate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Upgrade bool `json:"upgrade"`
	}
	// BUG FIX: Check error from Decode
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Upgrade {
		if err := packages.Upgrade(); err != nil {
			h.writeError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		if err := packages.Update(); err != nil {
			h.writeError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

