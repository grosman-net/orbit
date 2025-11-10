package api

import (
	"net/http"
	"orbit/internal/system"
)

func (h *Handler) handleSystemSummary(w http.ResponseWriter, r *http.Request) {
	summary, err := system.GetSummary()
	if err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, summary)
}

