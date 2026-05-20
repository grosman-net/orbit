package auth

import (
	"net"
	"net/http"
	"strings"
)

// GetClientIP returns the client IP, honoring proxy headers only from trusted proxies.
func GetClientIP(r *http.Request) string {
	remoteHost := remoteHostFromAddr(r.RemoteAddr)

	if isTrustedProxy(remoteHost, trustedProxies) {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			return strings.TrimSpace(parts[0])
		}
		if xri := r.Header.Get("X-Real-IP"); xri != "" {
			return strings.TrimSpace(xri)
		}
	}

	return remoteHost
}

func remoteHostFromAddr(addr string) string {
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		return strings.TrimSpace(addr)
	}
	return host
}

func isTrustedProxy(host string, trusted []string) bool {
	if len(trusted) == 0 {
		return false
	}
	for _, t := range trusted {
		if host == t {
			return true
		}
	}
	return false
}
