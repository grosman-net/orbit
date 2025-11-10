# Installation Guide

## Quick Install (Pre-built Binary)

If you don't want to build from source, download a pre-built binary from the [Releases](https://github.com/yourusername/orbit/releases) page:

```bash
# For x86_64 (amd64)
wget https://github.com/yourusername/orbit/releases/latest/download/orbit-linux-amd64
wget https://github.com/yourusername/orbit/releases/latest/download/orbit-setup-linux-amd64

# For ARM64
wget https://github.com/yourusername/orbit/releases/latest/download/orbit-linux-arm64
wget https://github.com/yourusername/orbit/releases/latest/download/orbit-setup-linux-arm64

# Make executable
chmod +x orbit-linux-* orbit-setup-linux-*

# Rename for convenience
sudo mv orbit-linux-amd64 /usr/local/bin/orbit
sudo mv orbit-setup-linux-amd64 /usr/local/bin/orbit-setup

# Create config directory
sudo mkdir -p /etc/orbit

# Run setup
sudo orbit-setup

# Create systemd service
sudo tee /etc/systemd/system/orbit.service <<EOF
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

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable orbit
sudo systemctl start orbit
```

## Build from Source

### Prerequisites

**Important**: Go 1.21 or later is required. Check your version:

```bash
go version
```

If you have Go 1.13 or earlier (common on Ubuntu 18.04/20.04 default repos), you need to upgrade:

#### Upgrading Go on Ubuntu/Debian

1. Remove old Go (if installed via apt):

```bash
sudo apt remove golang-go
```

2. Download and install latest Go:

```bash
# Download Go 1.23 (check https://go.dev/dl/ for latest version)
wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz

# Remove old installation and extract new
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz

# Add to PATH (add to ~/.bashrc or ~/.profile for persistence)
export PATH=$PATH:/usr/local/go/bin

# Verify
go version
```

### Building

Once you have Go 1.21+:

```bash
git clone https://github.com/yourusername/orbit.git
cd orbit
sudo ./install.sh
```

The install script will build and install everything automatically.

## Docker (Alternative)

If you prefer Docker:

```bash
# Build image
docker build -t orbit .

# Run container
docker run -d \
  --name orbit \
  --restart unless-stopped \
  -p 3333:3333 \
  -v /etc/orbit:/etc/orbit \
  --privileged \
  orbit
```

**Note**: `--privileged` is required for system management operations.

## Verification

Check that Orbit is running:

```bash
sudo systemctl status orbit
```

Access the panel:

```
http://<server-ip>:3333
```

## Troubleshooting

### "Go version is too old"

Upgrade Go to 1.21+ (see above).

### "Permission denied"

Ensure Orbit runs as root or with passwordless sudo:

```bash
sudo systemctl edit orbit
```

Add:

```ini
[Service]
User=root
```

### Port already in use

Change port in `/etc/orbit/config.json`:

```bash
sudo nano /etc/orbit/config.json
# Change "port" value
sudo systemctl restart orbit
```

### Can't connect to panel

Check firewall:

```bash
sudo ufw allow 3333/tcp
sudo ufw status
```

Check if service is running:

```bash
sudo systemctl status orbit
sudo journalctl -u orbit -n 50
```

