package config

import (
	"encoding/json"
	"os"
)

type Config struct {
	Port              int    `json:"port"`
	AdminUsername     string `json:"admin_username"`
	AdminPasswordHash string `json:"admin_password_hash"`
	SessionSecret     string `json:"session_secret"`
	PublicURL         string `json:"public_url"`
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

	return &cfg, nil
}

func Default() *Config {
	return &Config{
		Port:              3333,
		AdminUsername:     "admin",
		AdminPasswordHash: "",
		SessionSecret:     "",
		PublicURL:         "http://localhost:3333",
	}
}

