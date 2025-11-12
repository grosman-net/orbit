package api

import (
	"embed"
	"encoding/json"
	"io/fs"
	"net/http"

	"github.com/gorilla/mux"

	"orbit/internal/auth"
	"orbit/internal/config"
)

type Handler struct {
	router *mux.Router
	config *config.Config
}

func NewHandler(webFS embed.FS, cfg *config.Config) http.Handler {
	h := &Handler{
		router: mux.NewRouter(),
		config: cfg,
	}

	// Auth endpoints
	h.router.HandleFunc("/api/auth/login", h.handleLogin).Methods("POST")
	h.router.HandleFunc("/api/auth/logout", h.handleLogout).Methods("POST")
	h.router.HandleFunc("/api/auth/session", h.handleSession).Methods("GET")
	h.router.HandleFunc("/api/auth/first-login", auth.RequireAuth(h.handleCheckFirstLogin)).Methods("GET")
	h.router.HandleFunc("/api/auth/change-password", auth.RequireAuth(h.handleChangePassword)).Methods("POST")

	// API endpoints (protected)
	api := h.router.PathPrefix("/api").Subrouter()
	api.HandleFunc("/system/summary", auth.RequireAuth(h.handleSystemSummary)).Methods("GET")
	api.HandleFunc("/packages", auth.RequireAuth(h.handlePackages)).Methods("GET")
	api.HandleFunc("/packages/search", auth.RequireAuth(h.handlePackagesSearch)).Methods("GET")
	api.HandleFunc("/packages/install", auth.RequireAuth(h.handlePackagesInstall)).Methods("POST")
	api.HandleFunc("/packages/remove", auth.RequireAuth(h.handlePackagesRemove)).Methods("POST")
	api.HandleFunc("/packages/update", auth.RequireAuth(h.handlePackagesUpdate)).Methods("POST")
	api.HandleFunc("/services", auth.RequireAuth(h.handleServices)).Methods("GET")
	api.HandleFunc("/services/{unit}/start", auth.RequireAuth(h.handleServiceStart)).Methods("POST")
	api.HandleFunc("/services/{unit}/stop", auth.RequireAuth(h.handleServiceStop)).Methods("POST")
	api.HandleFunc("/services/{unit}/restart", auth.RequireAuth(h.handleServiceRestart)).Methods("POST")
	api.HandleFunc("/services/{unit}/enable", auth.RequireAuth(h.handleServiceEnable)).Methods("POST")
	api.HandleFunc("/services/{unit}/disable", auth.RequireAuth(h.handleServiceDisable)).Methods("POST")
	api.HandleFunc("/network", auth.RequireAuth(h.handleNetwork)).Methods("GET")
	api.HandleFunc("/network/firewall/enable", auth.RequireAuth(h.handleFirewallEnable)).Methods("POST")
	api.HandleFunc("/network/firewall/disable", auth.RequireAuth(h.handleFirewallDisable)).Methods("POST")
	api.HandleFunc("/network/firewall/allow", auth.RequireAuth(h.handleFirewallAllow)).Methods("POST")
	api.HandleFunc("/network/firewall/deny", auth.RequireAuth(h.handleFirewallDeny)).Methods("POST")
	api.HandleFunc("/network/firewall/delete", auth.RequireAuth(h.handleFirewallDelete)).Methods("POST")
	api.HandleFunc("/network/interface/up", auth.RequireAuth(h.handleInterfaceUp)).Methods("POST")
	api.HandleFunc("/network/interface/down", auth.RequireAuth(h.handleInterfaceDown)).Methods("POST")
	api.HandleFunc("/network/interface/setip", auth.RequireAuth(h.handleInterfaceSetIP)).Methods("POST")
	api.HandleFunc("/network/interface/add", auth.RequireAuth(h.handleInterfaceAdd)).Methods("POST")
	api.HandleFunc("/network/interface/delete", auth.RequireAuth(h.handleInterfaceDelete)).Methods("POST")
	api.HandleFunc("/network/route/add", auth.RequireAuth(h.handleRouteAdd)).Methods("POST")
	api.HandleFunc("/network/route/delete", auth.RequireAuth(h.handleRouteDelete)).Methods("POST")
	api.HandleFunc("/users", auth.RequireAuth(h.handleUsers)).Methods("GET")
	api.HandleFunc("/users/create", auth.RequireAuth(h.handleUserCreate)).Methods("POST")
	api.HandleFunc("/users/delete", auth.RequireAuth(h.handleUserDelete)).Methods("POST")
	api.HandleFunc("/users/lock", auth.RequireAuth(h.handleUserLock)).Methods("POST")
	api.HandleFunc("/users/unlock", auth.RequireAuth(h.handleUserUnlock)).Methods("POST")
	api.HandleFunc("/logs", auth.RequireAuth(h.handleLogs)).Methods("GET")
	api.HandleFunc("/config", auth.RequireAuth(h.handleConfigList)).Methods("GET")
	api.HandleFunc("/config/{id}", auth.RequireAuth(h.handleConfigRead)).Methods("GET")
	api.HandleFunc("/config/{id}", auth.RequireAuth(h.handleConfigWrite)).Methods("POST")
	api.HandleFunc("/config/{id}/schema", auth.RequireAuth(h.handleConfigSchema)).Methods("GET")
	api.HandleFunc("/config/{id}/parse", auth.RequireAuth(h.handleConfigParse)).Methods("GET")
	api.HandleFunc("/config/{id}/interactive", auth.RequireAuth(h.handleConfigApplyInteractive)).Methods("POST")

	// Serve embedded static files
	webRoot, _ := fs.Sub(webFS, "web")
	h.router.PathPrefix("/").Handler(http.FileServer(http.FS(webRoot)))

	return h.router
}

// Helper to write JSON responses
func (h *Handler) writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func (h *Handler) writeError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

