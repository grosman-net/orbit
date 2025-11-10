package api

import (
	"net/http"

	"github.com/gorilla/mux"

	"orbit/internal/services"
)

func (h *Handler) handleServices(w http.ResponseWriter, r *http.Request) {
	svcList, err := services.List()
	if err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, svcList)
}

func (h *Handler) handleServiceStart(w http.ResponseWriter, r *http.Request) {
	unit := mux.Vars(r)["unit"]
	if err := services.Start(unit); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleServiceStop(w http.ResponseWriter, r *http.Request) {
	unit := mux.Vars(r)["unit"]
	if err := services.Stop(unit); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleServiceRestart(w http.ResponseWriter, r *http.Request) {
	unit := mux.Vars(r)["unit"]
	if err := services.Restart(unit); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleServiceEnable(w http.ResponseWriter, r *http.Request) {
	unit := mux.Vars(r)["unit"]
	if err := services.Enable(unit); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

func (h *Handler) handleServiceDisable(w http.ResponseWriter, r *http.Request) {
	unit := mux.Vars(r)["unit"]
	if err := services.Disable(unit); err != nil {
		h.writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.writeJSON(w, map[string]bool{"success": true})
}

