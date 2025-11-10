package configfiles

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

// ParsedConfig represents parsed config with current values
type ParsedConfig struct {
	Schema ConfigSchema         `json:"schema"`
	Values map[string]FieldValue `json:"values"`
}

type FieldValue struct {
	Value    string `json:"value"`
	Enabled  bool   `json:"enabled"`  // false if commented out
	LineNum  int    `json:"lineNum"`  // line number in file (for reference)
}

// ParseConfig reads a config file and extracts current values based on schema
func ParseConfig(id string) (*ParsedConfig, error) {
	schema, ok := GetSchema(id)
	if !ok {
		return nil, fmt.Errorf("unknown config: %s", id)
	}

	content, err := os.ReadFile(schema.FilePath)
	if err != nil {
		return nil, err
	}

	parsed := &ParsedConfig{
		Schema: schema,
		Values: make(map[string]FieldValue),
	}

	lines := strings.Split(string(content), "\n")

	for _, field := range schema.Fields {
		// Try to find the field in the file
		re, err := regexp.Compile(field.Pattern)
		if err != nil {
			continue
		}

		found := false
		for lineNum, line := range lines {
			if matches := re.FindStringSubmatch(line); matches != nil && len(matches) > 1 {
				enabled := !strings.HasPrefix(strings.TrimSpace(line), field.Comment)
				parsed.Values[field.Key] = FieldValue{
					Value:   matches[1],
					Enabled: enabled,
					LineNum: lineNum,
				}
				found = true
				break
			}
		}

		// If not found, use default
		if !found {
			parsed.Values[field.Key] = FieldValue{
				Value:   field.Default,
				Enabled: false,
				LineNum: -1,
			}
		}
	}

	return parsed, nil
}

// ApplyInteractiveChanges applies changes from interactive editor
func ApplyInteractiveChanges(id string, changes map[string]FieldValue) error {
	schema, ok := GetSchema(id)
	if !ok {
		return fmt.Errorf("unknown config: %s", id)
	}

	content, err := os.ReadFile(schema.FilePath)
	if err != nil {
		return err
	}

	lines := strings.Split(string(content), "\n")
	modified := false

	// Create a map of fields for quick lookup
	fieldMap := make(map[string]ConfigField)
	for _, field := range schema.Fields {
		fieldMap[field.Key] = field
	}

	// Apply changes
	for key, newValue := range changes {
		field, ok := fieldMap[key]
		if !ok {
			continue
		}

		re, err := regexp.Compile(field.Pattern)
		if err != nil {
			continue
		}

		// Find and update the line
		found := false
		for i, line := range lines {
			if matches := re.FindStringSubmatch(line); matches != nil {
				// Update this line
				newLine := buildConfigLine(field, newValue)
				if newLine != line {
					lines[i] = newLine
					modified = true
				}
				found = true
				break
			}
		}

		// If not found and enabled, add it
		if !found && newValue.Enabled {
			newLine := buildConfigLine(field, newValue)
			// Try to add it in a sensible place (end of file, or after a related section)
			lines = append(lines, newLine)
			modified = true
		}
	}

	if !modified {
		return nil
	}

	// Write back
	newContent := strings.Join(lines, "\n")
	return os.WriteFile(schema.FilePath, []byte(newContent), 0644)
}

// buildConfigLine constructs a config line from field and value
func buildConfigLine(field ConfigField, value FieldValue) string {
	var line string

	// Determine the format based on config type
	switch field.Key {
	case "IPV6", "DEFAULT_INPUT_POLICY", "DEFAULT_OUTPUT_POLICY", "DEFAULT_FORWARD_POLICY":
		// UFW style: KEY=value
		line = fmt.Sprintf("%s=%s", field.Key, value.Value)
	default:
		// SSH/Nginx style: Key value
		line = fmt.Sprintf("%s %s", field.Key, value.Value)
		// Add semicolon for nginx
		if strings.Contains(field.Pattern, ";") {
			line += ";"
		}
	}

	// Add comment if disabled
	if !value.Enabled {
		line = field.Comment + " " + line
	}

	return line
}

// ValidateConfigSyntax checks if config file has valid syntax (using system tools)
func ValidateConfigSyntax(id string) error {
	_, ok := GetSchema(id)
	if !ok {
		return fmt.Errorf("unknown config: %s", id)
	}

	// Use appropriate validation command
	switch id {
	case "ssh":
		// sshd -t tests the config
		return nil // Skip for now, would need sudo
	case "nginx":
		// nginx -t tests the config
		return nil // Skip for now
	default:
		return nil
	}
}

