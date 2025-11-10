package network

import (
	"strings"

	"orbit/internal/util"
)

type NetworkInfo struct {
	Interfaces     []Interface `json:"interfaces"`
	FirewallStatus string      `json:"firewallStatus"`
	FirewallRules  []string    `json:"firewallRules"`
	IPForwarding   bool        `json:"ipForwarding"`
}

type Interface struct {
	Name       string   `json:"name"`
	Addresses  []string `json:"addresses"`
	State      string   `json:"state"`
	MAC        string   `json:"mac"`
}

func GetInfo() (*NetworkInfo, error) {
	info := &NetworkInfo{}

	// Get interfaces
	ifaces, err := getInterfaces()
	if err == nil {
		info.Interfaces = ifaces
	}

	// Get firewall status
	status, err := getFirewallStatus()
	if err == nil {
		info.FirewallStatus = status
	}

	// Get firewall rules
	rules, err := getFirewallRules()
	if err == nil {
		info.FirewallRules = rules
	}

	// Check IP forwarding
	info.IPForwarding = isIPForwardingEnabled()

	return info, nil
}

func getInterfaces() ([]Interface, error) {
	_, err := util.RunCommandNoSudo("ip", "-j", "addr", "show")
	if err != nil {
		// Fallback to non-JSON format
		return getInterfacesFallback()
	}

	// Parse JSON output (simplified for now)
	// In production, you'd want to properly unmarshal the JSON
	return getInterfacesFallback()
}

func getInterfacesFallback() ([]Interface, error) {
	output, err := util.RunCommandNoSudo("ip", "addr", "show")
	if err != nil {
		return nil, err
	}

	var ifaces []Interface
	var currentIface *Interface

	for _, line := range strings.Split(output, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// New interface
		if !strings.HasPrefix(line, " ") && strings.Contains(line, ":") {
			if currentIface != nil {
				ifaces = append(ifaces, *currentIface)
			}
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				name := strings.TrimSuffix(parts[1], ":")
				state := "DOWN"
				if strings.Contains(line, "UP") {
					state = "UP"
				}
				currentIface = &Interface{
					Name:      name,
					State:     state,
					Addresses: []string{},
				}
			}
		} else if currentIface != nil {
			// Parse addresses
			if strings.HasPrefix(line, "inet ") || strings.HasPrefix(line, "inet6 ") {
				parts := strings.Fields(line)
				if len(parts) >= 2 {
					currentIface.Addresses = append(currentIface.Addresses, parts[1])
				}
			}
			// Parse MAC
			if strings.HasPrefix(line, "link/ether ") {
				parts := strings.Fields(line)
				if len(parts) >= 2 {
					currentIface.MAC = parts[1]
				}
			}
		}
	}

	if currentIface != nil {
		ifaces = append(ifaces, *currentIface)
	}

	return ifaces, nil
}

func getFirewallStatus() (string, error) {
	output, err := util.RunCommand("ufw", "status")
	if err != nil {
		return "unknown", nil
	}

	if strings.Contains(output, "Status: active") {
		return "active", nil
	} else if strings.Contains(output, "Status: inactive") {
		return "inactive", nil
	}
	return "unknown", nil
}

func getFirewallRules() ([]string, error) {
	output, err := util.RunCommand("ufw", "status", "numbered")
	if err != nil {
		return []string{}, nil
	}

	var rules []string
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "Status:") || strings.HasPrefix(line, "To") || strings.HasPrefix(line, "--") {
			continue
		}
		if strings.HasPrefix(line, "[") {
			rules = append(rules, line)
		}
	}
	return rules, nil
}

func isIPForwardingEnabled() bool {
	output, err := util.RunCommandNoSudo("sysctl", "net.ipv4.ip_forward")
	if err != nil {
		return false
	}
	return strings.Contains(output, "= 1")
}

func EnableFirewall() error {
	_, err := util.RunCommand("ufw", "--force", "enable")
	return err
}

func DisableFirewall() error {
	_, err := util.RunCommand("ufw", "disable")
	return err
}

func AllowPort(port, protocol string) error {
	if protocol == "" {
		protocol = "tcp"
	}
	_, err := util.RunCommand("ufw", "allow", port+"/"+protocol)
	return err
}

func DenyPort(port, protocol string) error {
	if protocol == "" {
		protocol = "tcp"
	}
	_, err := util.RunCommand("ufw", "deny", port+"/"+protocol)
	return err
}

func DeleteRule(rule string) error {
	_, err := util.RunCommand("ufw", "delete", rule)
	return err
}

