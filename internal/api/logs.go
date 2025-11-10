package api

import (
	"net/http"
	"strconv"

	"orbit/internal/services"
)

func (h *Handler) handleLogs(w http.ResponseWriter, r *http.Request) {
	unit := r.URL.Query().Get("unit")
	linesStr := r.URL.Query().Get("lines")
	
	lines := 50
	if linesStr != "" {
		if parsedLines, err := strconv.Atoi(linesStr); err == nil {
			lines = parsedLines
		}
	}

	logs, err := services.GetLogs(unit, lines)
	if err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.writeJSON(w, map[string]string{"logs": logs})
}

