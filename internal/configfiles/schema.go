package configfiles

// ConfigSchema defines the structure for interactive config editing
type ConfigSchema struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	FilePath    string         `json:"filePath"`
	Fields      []ConfigField  `json:"fields"`
}

type ConfigField struct {
	Key         string   `json:"key"`          // Config key (e.g., "Port", "PermitRootLogin")
	Label       string   `json:"label"`        // Human-readable label
	Type        string   `json:"type"`         // "toggle", "text", "number", "select"
	Options     []string `json:"options,omitempty"` // For select type
	Default     string   `json:"default,omitempty"`
	Description string   `json:"description"`
	Pattern     string   `json:"pattern"`      // Regex pattern to match in file
	Comment     string   `json:"comment"`      // Comment prefix (e.g., "#")
}

var ConfigSchemas = map[string]ConfigSchema{
	"ssh": {
		ID:          "ssh",
		Name:        "SSH Server",
		Description: "OpenSSH server configuration",
		FilePath:    "/etc/ssh/sshd_config",
		Fields: []ConfigField{
			{
				Key:         "Port",
				Label:       "SSH Port",
				Type:        "number",
				Default:     "22",
				Description: "Port for SSH connections",
				Pattern:     `^#?\s*Port\s+(\d+)`,
				Comment:     "#",
			},
			{
				Key:         "PermitRootLogin",
				Label:       "Permit Root Login",
				Type:        "select",
				Options:     []string{"yes", "no", "prohibit-password", "forced-commands-only"},
				Default:     "prohibit-password",
				Description: "Allow root user to login via SSH",
				Pattern:     `^#?\s*PermitRootLogin\s+(\w+)`,
				Comment:     "#",
			},
			{
				Key:         "PasswordAuthentication",
				Label:       "Password Authentication",
				Type:        "select",
				Options:     []string{"yes", "no"},
				Default:     "yes",
				Description: "Allow password-based authentication",
				Pattern:     `^#?\s*PasswordAuthentication\s+(\w+)`,
				Comment:     "#",
			},
			{
				Key:         "PubkeyAuthentication",
				Label:       "Public Key Authentication",
				Type:        "select",
				Options:     []string{"yes", "no"},
				Default:     "yes",
				Description: "Allow public key authentication",
				Pattern:     `^#?\s*PubkeyAuthentication\s+(\w+)`,
				Comment:     "#",
			},
			{
				Key:         "X11Forwarding",
				Label:       "X11 Forwarding",
				Type:        "select",
				Options:     []string{"yes", "no"},
				Default:     "no",
				Description: "Allow X11 forwarding",
				Pattern:     `^#?\s*X11Forwarding\s+(\w+)`,
				Comment:     "#",
			},
		},
	},
	"ufw": {
		ID:          "ufw",
		Name:        "UFW Firewall",
		Description: "Uncomplicated Firewall configuration",
		FilePath:    "/etc/default/ufw",
		Fields: []ConfigField{
			{
				Key:         "IPV6",
				Label:       "Enable IPv6",
				Type:        "select",
				Options:     []string{"yes", "no"},
				Default:     "yes",
				Description: "Enable IPv6 support in firewall",
				Pattern:     `^#?\s*IPV6\s*=\s*(\w+)`,
				Comment:     "#",
			},
			{
				Key:         "DEFAULT_INPUT_POLICY",
				Label:       "Default Input Policy",
				Type:        "select",
				Options:     []string{"ACCEPT", "DROP", "REJECT"},
				Default:     "DROP",
				Description: "Default policy for incoming connections",
				Pattern:     `^#?\s*DEFAULT_INPUT_POLICY\s*=\s*"?(\w+)"?`,
				Comment:     "#",
			},
			{
				Key:         "DEFAULT_OUTPUT_POLICY",
				Label:       "Default Output Policy",
				Type:        "select",
				Options:     []string{"ACCEPT", "DROP", "REJECT"},
				Default:     "ACCEPT",
				Description: "Default policy for outgoing connections",
				Pattern:     `^#?\s*DEFAULT_OUTPUT_POLICY\s*=\s*"?(\w+)"?`,
				Comment:     "#",
			},
			{
				Key:         "DEFAULT_FORWARD_POLICY",
				Label:       "Default Forward Policy",
				Type:        "select",
				Options:     []string{"ACCEPT", "DROP", "REJECT"},
				Default:     "DROP",
				Description: "Default policy for forwarded packets",
				Pattern:     `^#?\s*DEFAULT_FORWARD_POLICY\s*=\s*"?(\w+)"?`,
				Comment:     "#",
			},
		},
	},
	"nginx": {
		ID:          "nginx",
		Name:        "Nginx",
		Description: "Nginx web server configuration (simplified)",
		FilePath:    "/etc/nginx/nginx.conf",
		Fields: []ConfigField{
			{
				Key:         "worker_processes",
				Label:       "Worker Processes",
				Type:        "text",
				Default:     "auto",
				Description: "Number of worker processes (auto, or a number)",
				Pattern:     `^\s*worker_processes\s+([^;]+);`,
				Comment:     "#",
			},
			{
				Key:         "worker_connections",
				Label:       "Worker Connections",
				Type:        "number",
				Default:     "1024",
				Description: "Maximum simultaneous connections per worker",
				Pattern:     `^\s*worker_connections\s+(\d+);`,
				Comment:     "#",
			},
			{
				Key:         "keepalive_timeout",
				Label:       "Keepalive Timeout",
				Type:        "number",
				Default:     "65",
				Description: "Timeout for keepalive connections (seconds)",
				Pattern:     `^\s*keepalive_timeout\s+(\d+);`,
				Comment:     "#",
			},
			{
				Key:         "gzip",
				Label:       "Enable Gzip Compression",
				Type:        "select",
				Options:     []string{"on", "off"},
				Default:     "on",
				Description: "Enable gzip compression",
				Pattern:     `^\s*gzip\s+(on|off);`,
				Comment:     "#",
			},
		},
	},
}

// GetSchema returns the schema for a given config ID
func GetSchema(id string) (ConfigSchema, bool) {
	schema, ok := ConfigSchemas[id]
	return schema, ok
}

// ListSchemas returns all available schemas
func ListSchemas() []ConfigSchema {
	schemas := make([]ConfigSchema, 0, len(ConfigSchemas))
	for _, schema := range ConfigSchemas {
		schemas = append(schemas, schema)
	}
	return schemas
}

