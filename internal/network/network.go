package network

import (
	"fmt"
	"os"
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
	// Validate port and protocol to prevent injection
	if !isValidPort(port) {
		return fmt.Errorf("invalid port: %s", port)
	}
	if protocol == "" {
		protocol = "tcp"
	}
	if !isValidProtocol(protocol) {
		return fmt.Errorf("invalid protocol: %s", protocol)
	}
	_, err := util.RunCommand("ufw", "allow", port+"/"+protocol)
	return err
}

func DenyPort(port, protocol string) error {
	// Validate port and protocol to prevent injection
	if !isValidPort(port) {
		return fmt.Errorf("invalid port: %s", port)
	}
	if protocol == "" {
		protocol = "tcp"
	}
	if !isValidProtocol(protocol) {
		return fmt.Errorf("invalid protocol: %s", protocol)
	}
	_, err := util.RunCommand("ufw", "deny", port+"/"+protocol)
	return err
}

func DeleteRule(rule string) error {
	// Validate rule number to prevent injection
	if !isValidRuleNumber(rule) {
		return fmt.Errorf("invalid rule number: %s", rule)
	}
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
	// Validate interface name to prevent injection
	if !isValidInterfaceName(name) {
		return fmt.Errorf("invalid interface name: %s", name)
	}
	_, err := util.RunCommand("ip", "link", "set", "dev", name, "up")
	return err
}

func SetInterfaceDown(name string) error {
	// Validate interface name to prevent injection
	if !isValidInterfaceName(name) {
		return fmt.Errorf("invalid interface name: %s", name)
	}
	_, err := util.RunCommand("ip", "link", "set", "dev", name, "down")
	return err
}

func AddIPAddress(iface, address string) error {
	// Validate inputs to prevent injection
	if !isValidInterfaceName(iface) {
		return fmt.Errorf("invalid interface name: %s", iface)
	}
	if !isValidIPAddress(address) {
		return fmt.Errorf("invalid IP address: %s", address)
	}
	_, err := util.RunCommand("ip", "addr", "add", address, "dev", iface)
	return err
}

func DeleteIPAddress(iface, address string) error {
	// Validate inputs to prevent injection
	if !isValidInterfaceName(iface) {
		return fmt.Errorf("invalid interface name: %s", iface)
	}
	if !isValidIPAddress(address) {
		return fmt.Errorf("invalid IP address: %s", address)
	}
	_, err := util.RunCommand("ip", "addr", "del", address, "dev", iface)
	return err
}

// Route management
func AddRoute(destination, gateway, iface string) error {
	// Validate inputs to prevent injection
	if !isValidIPAddress(destination) {
		return fmt.Errorf("invalid destination: %s", destination)
	}
	if gateway != "" && !isValidIP(gateway) {
		return fmt.Errorf("invalid gateway: %s", gateway)
	}
	if iface != "" && !isValidInterfaceName(iface) {
		return fmt.Errorf("invalid interface: %s", iface)
	}
	
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
	// Validate destination to prevent injection
	if !isValidIPAddress(destination) {
		return fmt.Errorf("invalid destination: %s", destination)
	}
	_, err := util.RunCommand("ip", "route", "del", destination)
	return err
}

// Persistent network configuration using netplan
func SaveInterfaceConfig(iface, address, gateway string) error {
	// Validate all inputs to prevent injection
	if !isValidInterfaceName(iface) {
		return fmt.Errorf("invalid interface name: %s", iface)
	}
	if !isValidIPAddress(address) {
		return fmt.Errorf("invalid IP address: %s", address)
	}
	if gateway != "" && !isValidIP(gateway) {
		return fmt.Errorf("invalid gateway: %s", gateway)
	}
	
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

	// Write to netplan config using proper file writing instead of shell
	filePath := "/etc/netplan/99-orbit-" + iface + ".yaml"
	if err := os.WriteFile(filePath, []byte(config), 0644); err != nil {
		return err
	}

	// Apply netplan
	_, err := util.RunCommand("netplan", "apply")
	return err
}

func DeleteInterfaceConfig(iface string) error {
	// Validate interface name to prevent injection
	if !isValidInterfaceName(iface) {
		return fmt.Errorf("invalid interface name: %s", iface)
	}
	
	// Use os.Remove instead of shell command for better security
	filePath := "/etc/netplan/99-orbit-" + iface + ".yaml"
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return err
	}
	
	_, err := util.RunCommand("netplan", "apply")
	return err
}

// Validation functions to prevent command injection

func isValidInterfaceName(name string) bool {
	if name == "" || len(name) > 16 {
		return false
	}
	// Allow alphanumeric, underscore, colon, period, dash
	for _, c := range name {
		if !((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || 
			(c >= '0' && c <= '9') || c == '_' || c == ':' || c == '.' || c == '-') {
			return false
		}
	}
	return true
}

func isValidPort(port string) bool {
	if port == "" {
		return false
	}
	// Port can be a number or a range (e.g., "80" or "8000:9000")
	for _, c := range port {
		if !((c >= '0' && c <= '9') || c == ':') {
			return false
		}
	}
	return true
}

func isValidProtocol(protocol string) bool {
	// Only allow tcp, udp, or any
	return protocol == "tcp" || protocol == "udp" || protocol == "any"
}

func isValidRuleNumber(rule string) bool {
	if rule == "" {
		return false
	}
	// Rule number must be numeric only
	for _, c := range rule {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

func isValidIPAddress(addr string) bool {
	if addr == "" {
		return false
	}
	// Allow IP address with optional CIDR notation
	// Format: xxx.xxx.xxx.xxx or xxx.xxx.xxx.xxx/xx
	for _, c := range addr {
		if !((c >= '0' && c <= '9') || c == '.' || c == '/' || c == ':') {
			return false
		}
	}
	return true
}

func isValidIP(ip string) bool {
	if ip == "" {
		return false
	}
	// Allow IP address without CIDR notation
	// Format: xxx.xxx.xxx.xxx or IPv6
	for _, c := range ip {
		if !((c >= '0' && c <= '9') || c == '.' || c == ':' || 
			(c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}

// AddVirtualInterface adds a virtual network interface (VLAN, bridge, etc.)
func AddVirtualInterface(name, ifaceType string) error {
	// Validate interface name to prevent injection
	if !isValidInterfaceName(name) {
		return fmt.Errorf("invalid interface name: %s", name)
	}
	
	// Validate interface type
	validTypes := []string{"bridge", "vlan", "dummy", "veth"}
	isValidType := false
	for _, t := range validTypes {
		if ifaceType == t {
			isValidType = true
			break
		}
	}
	if !isValidType {
		return fmt.Errorf("invalid interface type: %s (must be bridge, vlan, dummy, or veth)", ifaceType)
	}
	
	_, err := util.RunCommand("ip", "link", "add", name, "type", ifaceType)
	return err
}

// DeleteInterface deletes a network interface
func DeleteInterface(name string) error {
	// Validate interface name to prevent injection
	if !isValidInterfaceName(name) {
		return fmt.Errorf("invalid interface name: %s", name)
	}
	
	// Prevent deletion of critical interfaces
	protectedInterfaces := []string{"lo", "eth0", "ens3", "enp0s3"}
	for _, protected := range protectedInterfaces {
		if name == protected {
			return fmt.Errorf("cannot delete protected interface: %s", name)
		}
	}
	
	// First bring it down
	_ = SetInterfaceDown(name)
	
	// Then delete it
	_, err := util.RunCommand("ip", "link", "delete", name)
	return err
}
