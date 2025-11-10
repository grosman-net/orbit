package packages

import (
	"fmt"
	"strings"

	"orbit/internal/util"
)

type Package struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	Description string `json:"description"`
	Installed   bool   `json:"installed"`
}

func List() ([]Package, error) {
	output, err := util.RunCommandNoSudo("dpkg-query", "-W", "-f=${Package}\t${Version}\t${binary:Summary}\n")
	if err != nil {
		return nil, err
	}

	var pkgs []Package
	for _, line := range strings.Split(strings.TrimSpace(output), "\n") {
		if line == "" {
			continue
		}
		parts := strings.Split(line, "\t")
		if len(parts) >= 3 {
			pkgs = append(pkgs, Package{
				Name:        parts[0],
				Version:     parts[1],
				Description: parts[2],
				Installed:   true,
			})
		}
	}
	return pkgs, nil
}

func Search(query string) ([]Package, error) {
	output, err := util.RunCommandNoSudo("apt-cache", "search", query)
	if err != nil {
		return nil, err
	}

	var results []Package
	for _, line := range strings.Split(strings.TrimSpace(output), "\n") {
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, " - ", 2)
		if len(parts) == 2 {
			results = append(results, Package{
				Name:        parts[0],
				Description: parts[1],
				Installed:   false,
			})
		}
	}
	return results, nil
}

func Install(pkg string) error {
	_, err := util.RunCommand("apt-get", "install", "-y", pkg)
	return err
}

func Remove(pkg string, purge bool) error {
	action := "remove"
	if purge {
		action = "purge"
	}
	_, err := util.RunCommand("apt-get", action, "-y", pkg)
	return err
}

func Update() error {
	_, err := util.RunCommand("apt-get", "update")
	return err
}

func Upgrade() error {
	_, err := util.RunCommand("apt-get", "upgrade", "-y")
	return err
}

func GetPackageInfo(pkg string) (string, error) {
	output, err := util.RunCommandNoSudo("apt-cache", "show", pkg)
	if err != nil {
		return "", fmt.Errorf("package not found")
	}
	return output, nil
}

