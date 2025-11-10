#!/bin/bash
set -e

echo "=== Orbit Installation ==="
echo

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Determine architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        GOARCH="amd64"
        ;;
    aarch64|arm64)
        GOARCH="arm64"
        ;;
    armv7l)
        GOARCH="arm"
        ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

echo "Detected architecture: $ARCH ($GOARCH)"

# Check if binaries already exist in current directory
if [ -f "./orbit" ] && [ -f "./orbit-setup" ]; then
    echo "Found pre-built binaries in current directory"
elif command -v go &> /dev/null; then
    # Go is installed, build from source
    GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
    echo "Go version: $GO_VERSION"
    
    # Check if Go version is sufficient (1.21+)
    GO_MAJOR=$(echo "$GO_VERSION" | cut -d. -f1)
    GO_MINOR=$(echo "$GO_VERSION" | cut -d. -f2)
    
    if [ "$GO_MAJOR" -lt 1 ] || ([ "$GO_MAJOR" -eq 1 ] && [ "$GO_MINOR" -lt 21 ]); then
        echo "Error: Go 1.21 or later is required (found $GO_VERSION)"
        echo "Please upgrade Go or use pre-built binaries"
        echo "See INSTALL.md for instructions"
        exit 1
    fi
    
    # Build the application
    echo
    echo "=== Building Orbit ==="
    go build -o orbit -ldflags="-s -w" .
    go build -o orbit-setup -ldflags="-s -w" ./cmd/setup
else
    echo "Error: Neither pre-built binaries found nor Go installed"
    echo
    echo "Option 1: Download pre-built binaries:"
    echo "  wget https://github.com/yourusername/orbit/releases/latest/download/orbit-linux-$GOARCH"
    echo "  wget https://github.com/yourusername/orbit/releases/latest/download/orbit-setup-linux-$GOARCH"
    echo "  chmod +x orbit-linux-$GOARCH orbit-setup-linux-$GOARCH"
    echo "  mv orbit-linux-$GOARCH orbit"
    echo "  mv orbit-setup-linux-$GOARCH orbit-setup"
    echo
    echo "Option 2: Install Go 1.21+ and run this script again"
    echo "  See INSTALL.md for instructions"
    exit 1
fi

# Install binaries
INSTALL_DIR="/usr/local/bin"
echo
echo "=== Installing to $INSTALL_DIR ==="
cp orbit "$INSTALL_DIR/"
cp orbit-setup "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/orbit"
chmod +x "$INSTALL_DIR/orbit-setup"

# Create config directory
mkdir -p /etc/orbit
chmod 755 /etc/orbit

# Run setup if config doesn't exist
if [ ! -f /etc/orbit/config.json ]; then
    echo
    echo "=== Initial Configuration ==="
    orbit-setup
else
    echo
    echo "Configuration already exists at /etc/orbit/config.json"
    read -p "Reconfigure? [y/N]: " RECONFIG
    if [ "$RECONFIG" = "y" ] || [ "$RECONFIG" = "Y" ]; then
        orbit-setup
    fi
fi

# Load configuration to get port
if [ -f /etc/orbit/config.json ]; then
    PORT=$(grep -Po '"port":\s*\K\d+' /etc/orbit/config.json || echo "3333")
else
    PORT=3333
fi

# Create systemd service
echo
echo "=== Creating systemd service ==="
cat > /etc/systemd/system/orbit.service <<EOF
[Unit]
Description=Orbit Server Management Panel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/orbit --config /etc/orbit/config.json --port $PORT
Restart=on-failure
RestartSec=5s
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable orbit.service
systemctl restart orbit.service

echo
echo "=== Installation Complete ==="
echo
echo "Service: orbit.service"
echo "Status: systemctl status orbit"
echo "Logs: journalctl -u orbit -f"
echo

# Detect primary IP
PRIMARY_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -Po 'src \K[\d.]+' || echo "localhost")

echo "Panel URL: http://$PRIMARY_IP:$PORT"
echo
echo "Use the credentials configured during setup to log in."

