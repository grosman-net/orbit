package services

import (
	"fmt"
	"strings"

	"orbit/internal/util"
)

type Service struct {
	Unit        string `json:"unit"`
	Load        string `json:"load"`
	Active      string `json:"active"`
	Sub         string `json:"sub"`
	Description string `json:"description"`
}

func List() ([]Service, error) {
	output, err := util.RunCommand("systemctl", "list-units", "--type=service", "--all", "--no-pager", "--plain", "--no-legend")
	if err != nil {
		return nil, err
	}

	var services []Service
	for _, line := range strings.Split(strings.TrimSpace(output), "\n") {
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) >= 5 {
			services = append(services, Service{
				Unit:        fields[0],
				Load:        fields[1],
				Active:      fields[2],
				Sub:         fields[3],
				Description: strings.Join(fields[4:], " "),
			})
		}
	}
	return services, nil
}

func Start(unit string) error {
	// Validate unit name to prevent injection
	if !isValidUnitName(unit) {
		return fmt.Errorf("invalid unit name: %s", unit)
	}
	_, err := util.RunCommand("systemctl", "start", unit)
	return err
}

func Stop(unit string) error {
	// Validate unit name to prevent injection
	if !isValidUnitName(unit) {
		return fmt.Errorf("invalid unit name: %s", unit)
	}
	_, err := util.RunCommand("systemctl", "stop", unit)
	return err
}

func Restart(unit string) error {
	// Validate unit name to prevent injection
	if !isValidUnitName(unit) {
		return fmt.Errorf("invalid unit name: %s", unit)
	}
	_, err := util.RunCommand("systemctl", "restart", unit)
	return err
}

func Enable(unit string) error {
	// Validate unit name to prevent injection
	if !isValidUnitName(unit) {
		return fmt.Errorf("invalid unit name: %s", unit)
	}
	_, err := util.RunCommand("systemctl", "enable", unit)
	return err
}

func Disable(unit string) error {
	// Validate unit name to prevent injection
	if !isValidUnitName(unit) {
		return fmt.Errorf("invalid unit name: %s", unit)
	}
	_, err := util.RunCommand("systemctl", "disable", unit)
	return err
}

func GetStatus(unit string) (string, error) {
	// Validate unit name to prevent injection
	if !isValidUnitName(unit) {
		return "", fmt.Errorf("invalid unit name: %s", unit)
	}
	output, err := util.RunCommand("systemctl", "status", unit)
	return output, err
}

func GetLogs(unit string, lines int) (string, error) {
	// Validate unit name to prevent injection
	if !isValidUnitName(unit) {
		return "", fmt.Errorf("invalid unit name: %s", unit)
	}
	
	// BUG FIX: Proper int to string conversion
	linesStr := "50"
	if lines > 0 {
		linesStr = fmt.Sprintf("%d", lines)
	}
	output, err := util.RunCommand("journalctl", "-u", unit, "-n", linesStr, "--no-pager")
	return output, err
}

// isValidUnitName validates systemd unit names to prevent command injection
func isValidUnitName(unit string) bool {
	if unit == "" || len(unit) > 256 {
		return false
	}
	// Allow alphanumeric, dash, underscore, dot, @, colon
	// Typical systemd unit: service.name, service@instance.service
	for _, c := range unit {
		if !((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || 
			(c >= '0' && c <= '9') || c == '-' || c == '_' || 
			c == '.' || c == '@' || c == ':') {
			return false
		}
	}
	return true
}

