package util

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net"
	"os/exec"
	"strings"
)

// GenerateRandomString generates a random hex string of given length
func GenerateRandomString(length int) string {
	// We need length hex characters; each byte gives 2 hex chars.
	byteLen := (length + 1) / 2
	buf := make([]byte, byteLen)
	if _, err := rand.Read(buf); err != nil {
		// This should never happen on a healthy system; fail fast instead of
		// silently producing low-entropy secrets.
		panic(fmt.Sprintf("failed to generate secure random data: %v", err))
	}

	hexStr := hex.EncodeToString(buf)
	if len(hexStr) < length {
		return hexStr
	}
	return hexStr[:length]
}

// DetectPrimaryIP attempts to detect the primary non-loopback IP address
func DetectPrimaryIP() string {
	// Try to get default route interface IP
	cmd := exec.Command("ip", "route", "get", "1.1.1.1")
	output, err := cmd.Output()
	if err == nil {
		lines := strings.Split(string(output), "\n")
		for _, line := range lines {
			if strings.Contains(line, "src") {
				parts := strings.Fields(line)
				for i, part := range parts {
					if part == "src" && i+1 < len(parts) {
						return parts[i+1]
					}
				}
			}
		}
	}

	// Fallback: try to get first non-loopback interface
	ifaces, err := net.Interfaces()
	if err != nil {
		return "localhost"
	}

	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
				if ipnet.IP.To4() != nil {
					return ipnet.IP.String()
				}
			}
		}
	}

	return "localhost"
}

// RunCommand executes a shell command with sudo
func RunCommand(command string, args ...string) (string, error) {
	// Prepend sudo -n for non-interactive sudo
	fullArgs := append([]string{"-n", command}, args...)
	cmd := exec.Command("sudo", fullArgs...)
	output, err := cmd.CombinedOutput()
	return string(output), err
}

// RunCommandNoSudo executes a shell command without sudo
func RunCommandNoSudo(command string, args ...string) (string, error) {
	cmd := exec.Command(command, args...)
	output, err := cmd.CombinedOutput()
	return string(output), err
}

