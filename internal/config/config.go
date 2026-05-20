package config

import (
	"encoding/json"
	"os"
)

type Config struct {
	Port              int      `json:"port"`
	AdminUsername     string   `json:"admin_username"`
	AdminPasswordHash string   `json:"admin_password_hash"`
	SessionSecret     string   `json:"session_secret"`
	PublicURL         string   `json:"public_url"`
	FirstLogin        bool     `json:"first_login"`
	TrustedProxies    []string `json:"trusted_proxies"`
	TLSCert           string   `json:"tls_cert"`
	TLSKey            string   `json:"tls_key"`
	BindAddress       string   `json:"bind_address"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	def := Default()
	if len(cfg.TrustedProxies) == 0 {
		cfg.TrustedProxies = def.TrustedProxies
	}
	if cfg.BindAddress == "" {
		cfg.BindAddress = def.BindAddress
	}
	if cfg.Port == 0 {
		cfg.Port = def.Port
	}

	return &cfg, nil
}

func Default() *Config {
	return &Config{
		Port:              3333,
		AdminUsername:     "admin",
		AdminPasswordHash: "",
		SessionSecret:     "",
		PublicURL:         "http://localhost:3333",
		FirstLogin:        false,
		TrustedProxies:    []string{"127.0.0.1", "::1"},
		BindAddress:       "0.0.0.0",
	}
}

func Save(cfg *Config, path string) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

