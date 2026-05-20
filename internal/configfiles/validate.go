package configfiles

import (
	"fmt"
	"os"
	"path/filepath"

	"orbit/internal/util"
)

// ValidateContent checks config syntax before applying changes.
func ValidateContent(id, content string) error {
	cfg := findConfig(id)
	if cfg == nil {
		return fmt.Errorf("config not found")
	}

	tmpDir, err := os.MkdirTemp("/tmp", "orbit-validate-")
	if err != nil {
		return fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	tmpFile := filepath.Join(tmpDir, filepath.Base(cfg.Path))
	if err := os.WriteFile(tmpFile, []byte(content), 0600); err != nil {
		return fmt.Errorf("failed to write temp config: %w", err)
	}

	switch id {
	case "ssh":
		if _, err := util.RunCommand("sshd", "-t", "-f", tmpFile); err != nil {
			return fmt.Errorf("sshd config test failed: %w", err)
		}
	case "nginx":
		if _, err := util.RunCommand("nginx", "-t", "-c", tmpFile); err != nil {
			return fmt.Errorf("nginx config test failed: %w", err)
		}
	}

	return nil
}
