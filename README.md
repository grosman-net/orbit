# Orbit

Lightweight server management panel for Ubuntu/Debian. Single binary, no dependencies, full control.

## Features

- 📊 **Real-time Monitoring**: CPU, RAM, disk, network, swap, I/O, load average
- 📦 **Package Management**: Install, remove, update APT packages
- ⚙️ **Service Control**: Manage systemd services
- 🌐 **Network**: UFW firewall, interface monitoring
- 👥 **User Management**: Create, lock, unlock, delete users
- 📝 **Config Editor**: Edit system config files (Nginx, SSH, etc.)
- 📋 **Logs**: View systemd service logs
- 🔒 **Secure**: Password-protected with bcrypt, session-based auth

## Quick Install

### Download Pre-built Binary

```bash
# For x86_64 (most common)
wget https://github.com/yourusername/orbit/releases/latest/download/orbit-linux-amd64
wget https://github.com/yourusername/orbit/releases/latest/download/orbit-setup-linux-amd64

chmod +x orbit-linux-amd64 orbit-setup-linux-amd64
sudo mv orbit-linux-amd64 /usr/local/bin/orbit
sudo mv orbit-setup-linux-amd64 /usr/local/bin/orbit-setup

# For ARM64
# wget https://github.com/yourusername/orbit/releases/latest/download/orbit-linux-arm64
# wget https://github.com/yourusername/orbit/releases/latest/download/orbit-setup-linux-arm64
```

### Configure

```bash
sudo mkdir -p /etc/orbit
sudo orbit-setup
```

### Create Service

```bash
sudo tee /etc/systemd/system/orbit.service <<'EOF'
[Unit]
Description=Orbit Server Management Panel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/orbit --config /etc/orbit/config.json
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable orbit
sudo systemctl start orbit
```

### Access

```
http://<your-server-ip>:3333
```

Login with credentials from setup.

## Build from Source

**Requires Go 1.21+**

```bash
git clone https://github.com/yourusername/orbit.git
cd orbit
git checkout go-rewrite
sudo ./install.sh
```

The install script handles everything automatically.

## Usage

### Service Management

```bash
sudo systemctl status orbit   # Check status
sudo systemctl restart orbit  # Restart
sudo systemctl stop orbit     # Stop
sudo journalctl -u orbit -f   # View logs
```

### Configuration

Edit `/etc/orbit/config.json` or run `sudo orbit-setup` again.

```json
{
  "port": 3333,
  "admin_username": "admin",
  "admin_password_hash": "$2a$12$...",
  "session_secret": "...",
  "public_url": "http://185.105.118.251:3333"
}
```

### Command-Line Options

```bash
orbit --help
orbit --port 8080
orbit --config /path/to/config.json
```

### Uninstall

```bash
sudo systemctl stop orbit
sudo systemctl disable orbit
sudo rm /etc/systemd/system/orbit.service
sudo rm /usr/local/bin/orbit /usr/local/bin/orbit-setup
sudo rm -rf /etc/orbit  # Optional: remove config
sudo systemctl daemon-reload
```

## Security

**Important**: Orbit runs with root privileges to manage system services. Always use it securely:

1. **Use HTTPS**: Put Orbit behind a reverse proxy with SSL/TLS
2. **Firewall**: Restrict access to trusted IPs only
3. **Strong Passwords**: Use complex, unique passwords
4. **Keep Updated**: Update Orbit and your system regularly

### Example Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name orbit.example.com;

    ssl_certificate /etc/letsencrypt/live/orbit.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/orbit.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Development

```bash
# Build
make build

# Run locally
make run

# Build for all architectures
make build-all
```

### Project Structure

```
orbit/
├── main.go                    # Entry point
├── internal/
│   ├── api/                   # HTTP handlers
│   ├── auth/                  # Authentication
│   ├── system/                # Monitoring
│   ├── packages/              # APT management
│   ├── services/              # Systemd control
│   ├── network/               # Network & firewall
│   ├── users/                 # User management
│   └── util/                  # Utilities
├── cmd/setup/                 # Setup wizard
└── web/                       # Frontend (embedded)
```

## Troubleshooting

### Port Already in Use

```bash
sudo nano /etc/orbit/config.json  # Change port
sudo systemctl restart orbit
```

### Permission Errors

Ensure Orbit runs as root:

```bash
sudo systemctl edit orbit
```

Add:

```ini
[Service]
User=root
```

### Can't Access Panel

Check firewall:

```bash
sudo ufw allow 3333/tcp
sudo ufw status
```

Check service:

```bash
sudo systemctl status orbit
sudo journalctl -u orbit -n 50
```

## Architecture

- **Backend**: Go 1.21+ with Gorilla Mux
- **Frontend**: Vanilla JavaScript, embedded at compile time
- **Size**: ~15 MB single binary
- **Dependencies**: None at runtime

## Why Go Rewrite?

Previously Node.js/Next.js (~500 MB), now Go (~15 MB):

- ✅ 33x smaller
- ✅ Zero runtime dependencies
- ✅ Simpler installation
- ✅ Better performance
- ✅ Native system integration

## Contributing

Contributions welcome! Open an issue or pull request.

## License

MIT License - See LICENSE file

## Credits

Created for simple, efficient Ubuntu/Debian server management.
