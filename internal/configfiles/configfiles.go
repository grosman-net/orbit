package configfiles

import (
	"fmt"
	"os"
	"path/filepath"

	"orbit/internal/util"
)

type ConfigFile struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Path        string `json:"path"`
	Description string `json:"description"`
	Editable    bool   `json:"editable"`
}

var knownConfigs = []ConfigFile{
	{
		ID:          "nginx",
		Name:        "Nginx",
		Path:        "/etc/nginx/nginx.conf",
		Description: "Nginx web server configuration",
		Editable:    true,
	},
	{
		ID:          "ssh",
		Name:        "SSH Server",
		Path:        "/etc/ssh/sshd_config",
		Description: "OpenSSH server configuration",
		Editable:    true,
	},
	{
		ID:          "ufw",
		Name:        "UFW",
		Path:        "/etc/ufw/ufw.conf",
		Description: "Uncomplicated Firewall configuration",
		Editable:    true,
	},
	{
		ID:          "hosts",
		Name:        "Hosts",
		Path:        "/etc/hosts",
		Description: "Static hostname mappings",
		Editable:    true,
	},
	{
		ID:          "fstab",
		Name:        "Filesystem Table",
		Path:        "/etc/fstab",
		Description: "Filesystem mount configuration",
		Editable:    true,
	},
}

func List() []ConfigFile {
	// Filter to only show configs that exist
	var available []ConfigFile
	for _, cfg := range knownConfigs {
		if _, err := os.Stat(cfg.Path); err == nil {
			available = append(available, cfg)
		}
	}
	return available
}

func Read(id string) (string, error) {
	cfg := findConfig(id)
	if cfg == nil {
		return "", fmt.Errorf("config not found")
	}

	data, err := os.ReadFile(cfg.Path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func Write(id, content string) error {
	cfg := findConfig(id)
	if cfg == nil {
		return fmt.Errorf("config not found")
	}
	if !cfg.Editable {
		return fmt.Errorf("config is not editable")
	}

	// Write to temp file first in a writable location to avoid issues with read-only /etc
	tmpDir := "/tmp"
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		return fmt.Errorf("failed to prepare temp dir: %w", err)
	}

	tmpFile := filepath.Join(tmpDir, fmt.Sprintf("orbit-config-%s.tmp", cfg.ID))
	if err := os.WriteFile(tmpFile, []byte(content), 0644); err != nil {
		// Most common case: read-only filesystem in the target environment
		return fmt.Errorf("failed to write temporary config file: %w", err)
	}

	// Move with sudo into the real config path
	if _, err := util.RunCommand("mv", tmpFile, cfg.Path); err != nil {
		// Surface a clearer error when target filesystem is read-only
		if os.IsPermission(err) {
			return fmt.Errorf("failed to save config: permission denied (filesystem may be read-only)")
		}
		return fmt.Errorf("failed to save config: %w", err)
	}

	return nil
}

func findConfig(id string) *ConfigFile {
	for _, cfg := range knownConfigs {
		if cfg.ID == id {
			return &cfg
		}
	}
	return nil
}

