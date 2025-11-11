package auth

import (
	"net/http"
	"sync"
	"time"
)

// LoginAttempt tracks login attempts per IP
type LoginAttempt struct {
	Count     int
	LastReset time.Time
}

var (
	loginAttempts = make(map[string]*LoginAttempt)
	attemptsMutex sync.RWMutex
)

const (
	maxLoginAttempts = 5
	resetDuration    = 15 * time.Minute
)

// CheckRateLimit checks if the IP has exceeded login attempts
func CheckRateLimit(ip string) bool {
	attemptsMutex.Lock()
	defer attemptsMutex.Unlock()

	now := time.Now()
	
	// Get or create attempt record
	attempt, exists := loginAttempts[ip]
	if !exists {
		loginAttempts[ip] = &LoginAttempt{
			Count:     1,
			LastReset: now,
		}
		return true
	}

	// Reset counter if duration has passed
	if now.Sub(attempt.LastReset) > resetDuration {
		attempt.Count = 1
		attempt.LastReset = now
		return true
	}

	// Check if limit exceeded
	if attempt.Count >= maxLoginAttempts {
		return false
	}

	attempt.Count++
	return true
}

// ResetRateLimit resets the rate limit for an IP (called on successful login)
func ResetRateLimit(ip string) {
	attemptsMutex.Lock()
	defer attemptsMutex.Unlock()
	delete(loginAttempts, ip)
}

// GetClientIP extracts the real client IP from the request
func GetClientIP(r *http.Request) string {
	// Check X-Forwarded-For header (common with reverse proxies)
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		// Take the first IP in the list
		return xff
	}
	
	// Check X-Real-IP header
	xri := r.Header.Get("X-Real-IP")
	if xri != "" {
		return xri
	}
	
	// Fall back to RemoteAddr
	return r.RemoteAddr
}

// CleanupOldAttempts periodically cleans up old login attempts
func CleanupOldAttempts() {
	ticker := time.NewTicker(1 * time.Hour)
	go func() {
		for range ticker.C {
			attemptsMutex.Lock()
			now := time.Now()
			for ip, attempt := range loginAttempts {
				if now.Sub(attempt.LastReset) > resetDuration {
					delete(loginAttempts, ip)
				}
			}
			attemptsMutex.Unlock()
		}
	}()
}

