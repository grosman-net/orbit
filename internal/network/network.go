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
	Routes         []Route     `json:"routes"`
}

type Interface struct {
	Name       string   `json:"name"`
	Addresses  []string `json:"addresses"`
	State      string   `json:"state"`
	MAC        string   `json:"mac"`
	Gateway    string   `json:"gateway"`
	MTU        string   `json:"mtu"`
}

type Route struct {
	Destination string `json:"destination"`
	Gateway     string `json:"gateway"`
	Interface   string `json:"interface"`
	Metric      string `json:"metric"`
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

	// Get routes
	routes, err := getRoutes()
	if err == nil {
		info.Routes = routes
	}

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
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}

		// New interface - starts with number: (e.g., "1: lo: <LOOPBACK,UP>")
		if len(line) > 0 && line[0] >= '0' && line[0] <= '9' && strings.Contains(line, ":") {
			if currentIface != nil {
				ifaces = append(ifaces, *currentIface)
			}
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				// parts[1] is the interface name with trailing ":"
				name := strings.TrimSuffix(parts[1], ":")
				state := "DOWN"
				// Check flags in angle brackets
				if strings.Contains(line, "UP") && strings.Contains(line, "state UP") || strings.Contains(line, "<") && strings.Contains(strings.Split(line, ">")[0], "UP") {
					state = "UP"
				}
				
				// Parse MTU
				mtu := ""
				for i, part := range parts {
					if part == "mtu" && i+1 < len(parts) {
						mtu = parts[i+1]
					}
				}
				
				currentIface = &Interface{
					Name:      name,
					State:     state,
					Addresses: []string{},
					MTU:       mtu,
				}
			}
		} else if currentIface != nil && strings.HasPrefix(trimmed, "link/") {
			// Parse MAC address
			parts := strings.Fields(trimmed)
			if len(parts) >= 2 {
				currentIface.MAC = parts[1]
			}
		} else if currentIface != nil && (strings.HasPrefix(trimmed, "inet ") || strings.HasPrefix(trimmed, "inet6 ")) {
			// Parse IP addresses
			parts := strings.Fields(trimmed)
			if len(parts) >= 2 {
				currentIface.Addresses = append(currentIface.Addresses, parts[1])
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


// Get routing table
func getRoutes() ([]Route, error) {
	output, err := util.RunCommandNoSudo("ip", "route", "show")
	if err != nil {
		return nil, err
	}

	var routes []Route
	for _, line := range strings.Split(output, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		parts := strings.Fields(line)
		if len(parts) < 3 {
			continue
		}

		route := Route{
			Destination: parts[0],
		}

		for i := 1; i < len(parts); i++ {
			if parts[i] == "via" && i+1 < len(parts) {
				route.Gateway = parts[i+1]
			} else if parts[i] == "dev" && i+1 < len(parts) {
				route.Interface = parts[i+1]
			} else if parts[i] == "metric" && i+1 < len(parts) {
				route.Metric = parts[i+1]
			}
		}

		routes = append(routes, route)
	}

	return routes, nil
}

// Interface management
func SetInterfaceUp(name string) error {
	_, err := util.RunCommand("ip", "link", "set", "dev", name, "up")
	return err
}

func SetInterfaceDown(name string) error {
	_, err := util.RunCommand("ip", "link", "set", "dev", name, "down")
	return err
}

func AddIPAddress(iface, address string) error {
	_, err := util.RunCommand("ip", "addr", "add", address, "dev", iface)
	return err
}

func DeleteIPAddress(iface, address string) error {
	_, err := util.RunCommand("ip", "addr", "del", address, "dev", iface)
	return err
}

// Route management
func AddRoute(destination, gateway, iface string) error {
	args := []string{"route", "add", destination}
	if gateway != "" {
		args = append(args, "via", gateway)
	}
	if iface != "" {
		args = append(args, "dev", iface)
	}
	_, err := util.RunCommand("ip", args...)
	return err
}

func DeleteRoute(destination string) error {
	_, err := util.RunCommand("ip", "route", "del", destination)
	return err
}

// Persistent network configuration using netplan
func SaveInterfaceConfig(iface, address, gateway string) error {
	// This is a simplified version
	// In production, you'd want to properly parse and modify existing netplan config
	config := `network:
  version: 2
  renderer: networkd
  ethernets:
    ` + iface + `:
      addresses:
        - ` + address + `
`
	if gateway != "" {
		config += `      routes:
        - to: default
          via: ` + gateway + `
`
	}

	// Write to netplan config
	_, err := util.RunCommand("sh", "-c", "echo '"+config+"' > /etc/netplan/99-orbit-"+iface+".yaml")
	if err != nil {
		return err
	}

	// Apply netplan
	_, err = util.RunCommand("netplan", "apply")
	return err
}

func DeleteInterfaceConfig(iface string) error {
	_, err := util.RunCommand("rm", "-f", "/etc/netplan/99-orbit-"+iface+".yaml")
	if err != nil {
		return err
	}
	_, err = util.RunCommand("netplan", "apply")
	return err
}
