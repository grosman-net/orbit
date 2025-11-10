package api

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"

	"orbit/internal/configfiles"
)

func (h *Handler) handleConfigList(w http.ResponseWriter, r *http.Request) {
	configs := configfiles.List()
	h.writeJSON(w, configs)
}

func (h *Handler) handleConfigRead(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	content, err := configfiles.Read(id)
	if err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]string{"content": content})
}

func (h *Handler) handleConfigWrite(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := configfiles.Write(id, req.Content); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

