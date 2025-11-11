package api

import (
	"net/http"
	"strconv"

	"orbit/internal/services"
)

func (h *Handler) handleLogs(w http.ResponseWriter, r *http.Request) {
	unit := r.URL.Query().Get("unit")
	linesStr := r.URL.Query().Get("lines")
	
	// BUG FIX #1: Validate unit parameter is not empty
	if unit == "" {
		h.writeError(w, "Unit parameter is required", http.StatusBadRequest)
		return
	}
	
	lines := 50
	if linesStr != "" {
		if parsedLines, err := strconv.Atoi(linesStr); err == nil {
			// BUG FIX #2: Validate lines is positive
			if parsedLines > 0 && parsedLines <= 10000 {
				lines = parsedLines
			}
		}
	}

	logs, err := services.GetLogs(unit, lines)
	if err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.writeJSON(w, map[string]string{"logs": logs})
}

