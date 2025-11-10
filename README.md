# Orbit

**Orbit** is a lightweight server management panel for Ubuntu/Debian systems. It provides a modern web interface to monitor system resources, manage packages, control services, configure firewall rules, and more.

## Features

- 🖥️ **System Monitoring**: Real-time CPU, memory, disk, network, and process statistics
- 📦 **Package Management**: Install, remove, and search APT packages
- ⚙️ **Service Control**: Start, stop, restart, and manage systemd services
- 🌐 **Network Management**: View interfaces and control UFW firewall
- 👥 **User Management**: Create, lock, unlock, and delete system users
- 📝 **Configuration Editor**: Edit system config files (Nginx, SSH, etc.)
- 📋 **Log Viewer**: View systemd service logs
- 🔒 **Secure Authentication**: Password-protected web interface

## Architecture

Orbit is built with **Go** and compiles into a single static binary with embedded frontend assets. This design eliminates runtime dependencies and simplifies deployment.

- **Backend**: Go 1.23+ with Gorilla Mux for routing
- **Frontend**: Vanilla JavaScript with modern CSS
- **Embedded Assets**: All HTML/CSS/JS bundled into the binary
- **Authentication**: Session-based with bcrypt password hashing

## Requirements

- **OS**: Ubuntu 20.04+ or Debian 11+ (Linux x86_64, ARM64, or ARM)
- **Go**: 1.23 or later (only needed for building from source)
- **Privileges**: Root access required for system management operations

## Quick Start

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/orbit.git
cd orbit
```

2. Run the installation script:

```bash
sudo ./install.sh
```

The installer will:
- Build the Orbit binary
- Install it to `/usr/local/bin`
- Run the setup wizard to configure credentials and port
- Create and start a systemd service

3. Access the panel:

```
http://<your-server-ip>:3333
```

Use the credentials you configured during setup to log in.

### Configuration

The setup wizard (`orbit-setup`) will prompt you for:

- **HTTP Port**: Port to listen on (default: 3333)
- **Admin Username**: Username for authentication (default: admin)
- **Admin Password**: Password (securely hashed with bcrypt)
- **Public URL**: Base URL for the panel

Configuration is stored in `/etc/orbit/config.json`.

To reconfigure:

```bash
sudo orbit-setup
sudo systemctl restart orbit
```

### Uninstallation

```bash
sudo ./uninstall.sh
```

This will:
- Stop and disable the orbit.service
- Remove binaries from `/usr/local/bin`
- Optionally remove `/etc/orbit/config.json`

## Manual Build

If you want to build manually:

```bash
# Build main binary
go build -o orbit -ldflags="-s -w" .

# Build setup tool
go build -o orbit-setup -ldflags="-s -w" ./cmd/setup

# Run setup
sudo ./orbit-setup

# Run Orbit
sudo ./orbit --config /etc/orbit/config.json
```

## Makefile Targets

- `make build`: Build the binaries
- `make install`: Install Orbit (requires sudo)
- `make uninstall`: Uninstall Orbit (requires sudo)
- `make run`: Build and run locally with `config.json`
- `make dev`: Run in development mode
- `make setup`: Run the setup wizard
- `make build-all`: Cross-compile for amd64, arm64, and arm

## Usage

### Managing the Service

```bash
# Start
sudo systemctl start orbit

# Stop
sudo systemctl stop orbit

# Restart
sudo systemctl restart orbit

# Status
sudo systemctl status orbit

# Logs
sudo journalctl -u orbit -f
```

### Command-Line Options

```bash
orbit --help
```

- `--port`: HTTP port (default: 3333)
- `--config`: Path to config file (default: /etc/orbit/config.json)

### Sudo Requirements

Orbit requires passwordless sudo access for system management commands. During installation, the service runs as root by default.

If running as a non-root user, ensure the user has `NOPASSWD` sudo access:

```bash
echo "orbit ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/orbit
```

## Security Considerations

- **Run over HTTPS**: Use a reverse proxy (Nginx, Caddy) with SSL/TLS for production
- **Firewall**: Restrict access to the Orbit port using UFW or iptables
- **Strong Passwords**: Use strong, unique passwords for the admin account
- **Updates**: Keep your system and Orbit up to date

Example Nginx reverse proxy config:

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

### Project Structure

```
orbit/
├── main.go                 # Application entry point
├── go.mod                  # Go module definition
├── internal/
│   ├── api/                # HTTP handlers and routes
│   ├── auth/               # Authentication logic
│   ├── config/             # Configuration management
│   ├── configfiles/        # Config file editing
│   ├── network/            # Network and firewall management
│   ├── packages/           # APT package management
│   ├── services/           # Systemd service control
│   ├── system/             # System monitoring
│   ├── users/              # User management
│   └── util/               # Utilities
├── cmd/
│   └── setup/              # Setup wizard
├── web/                    # Frontend assets (embedded)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── favicon.svg
├── install.sh              # Installation script
├── uninstall.sh            # Uninstallation script
├── Makefile                # Build automation
└── README.md
```

### Running Locally

1. Create a local `config.json`:

```bash
go run ./cmd/setup
```

2. Run the server:

```bash
go run . --config config.json
```

3. Open http://localhost:3333

### Adding New Features

- **Backend**: Add handlers in `internal/api/`, implement logic in appropriate packages
- **Frontend**: Edit `web/app.js` and `web/index.html`
- **Assets**: Run `go build` to re-embed assets

## Troubleshooting

### Port Already in Use

Change the port in `/etc/orbit/config.json` and restart:

```bash
sudo nano /etc/orbit/config.json
sudo systemctl restart orbit
```

### Permission Errors

Ensure Orbit is running as root or the user has passwordless sudo:

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
sudo ufw status
sudo ufw allow 3333/tcp
```

Check service status:

```bash
sudo systemctl status orbit
sudo journalctl -u orbit -n 50
```

## Contributing

Contributions are welcome! Please open an issue or pull request on GitHub.

## License

MIT License - see LICENSE file for details.

## Credits

Created for simple, efficient server management on Ubuntu/Debian systems.
