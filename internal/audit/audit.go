package audit

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const logPath = "/var/log/orbit/audit.log"

var mu sync.Mutex

type Entry struct {
	Time     string `json:"time"`
	User     string `json:"user"`
	IP       string `json:"ip"`
	Method   string `json:"method"`
	Path     string `json:"path"`
	Status   int    `json:"status"`
}

// Log records an admin action.
func Log(user, ip, method, path string, status int) {
	if user == "" {
		return
	}

	entry := Entry{
		Time:   time.Now().UTC().Format(time.RFC3339),
		User:   user,
		IP:     ip,
		Method: method,
		Path:   path,
		Status: status,
	}

	data, err := json.Marshal(entry)
	if err != nil {
		return
	}

	mu.Lock()
	defer mu.Unlock()

	if err := os.MkdirAll(filepath.Dir(logPath), 0750); err != nil {
		return
	}

	f, err := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0640)
	if err != nil {
		return
	}
	defer f.Close()
	fmt.Fprintf(f, "%s\n", data)
}
