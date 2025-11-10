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

# Function to install Go
install_go() {
    echo "=== Installing Go 1.23.0 ==="
    
    GO_VERSION="1.23.0"
    GO_TARBALL="go${GO_VERSION}.linux-${GOARCH}.tar.gz"
    GO_URL="https://go.dev/dl/${GO_TARBALL}"
    
    # Save current directory
    local ORIG_DIR="$(pwd)"
    
    echo "Downloading Go ${GO_VERSION}..."
    cd /tmp
    wget -q --show-progress "$GO_URL" || {
        echo "Error: Failed to download Go"
        cd "$ORIG_DIR"
        exit 1
    }
    
    echo "Installing Go to /usr/local/go..."
    rm -rf /usr/local/go
    tar -C /usr/local -xzf "$GO_TARBALL"
    rm "$GO_TARBALL"
    
    # Return to original directory
    cd "$ORIG_DIR"
    
    # Add to PATH
    export PATH=$PATH:/usr/local/go/bin
    
    # Add to profile for persistence
    if ! grep -q "/usr/local/go/bin" /etc/profile; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
    fi
    
    if ! grep -q "/usr/local/go/bin" ~/.bashrc; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    fi
    
    echo "✓ Go $(go version | awk '{print $3}') installed successfully"
    echo
}

# Check if binaries already exist in current directory
if [ -f "./orbit" ] && [ -f "./orbit-setup" ]; then
    echo "Found pre-built binaries in current directory"
elif command -v go &> /dev/null; then
    # Go is installed, check version
    GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
    echo "Found Go version: $GO_VERSION"
    
    # Check if Go version is sufficient (1.21+)
    GO_MAJOR=$(echo "$GO_VERSION" | cut -d. -f1)
    GO_MINOR=$(echo "$GO_VERSION" | cut -d. -f2)
    
    if [ "$GO_MAJOR" -lt 1 ] || ([ "$GO_MAJOR" -eq 1 ] && [ "$GO_MINOR" -lt 21 ]); then
        echo "Go version too old (need 1.21+, found $GO_VERSION)"
        echo "Upgrading Go..."
        install_go
    fi
    
    # Build the application
    echo
    echo "=== Building Orbit from source ==="
    go build -o orbit -ldflags="-s -w" .
    go build -o orbit-setup -ldflags="-s -w" ./cmd/setup
else
    # Go not installed, install it automatically
    echo "Go not found, installing automatically..."
    echo
    
    # Check for required tools
    if ! command -v wget &> /dev/null; then
        echo "Installing wget..."
        apt-get update -qq
        apt-get install -y wget
    fi
    
    install_go
    
    # Now build (we're already in the right directory)
    echo "=== Building Orbit from source ==="
    go build -o orbit -ldflags="-s -w" .
    go build -o orbit-setup -ldflags="-s -w" ./cmd/setup
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
ExecStart=/usr/local/bin/orbit --config /etc/orbit/config.json
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
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ✅ ORBIT INSTALLATION COMPLETE!                        ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo

# Get configured values from config.json
if [ -f /etc/orbit/config.json ]; then
    CONFIGURED_USERNAME=$(grep -Po '"admin_username":\s*"\K[^"]+' /etc/orbit/config.json || echo "admin")
    CONFIGURED_PORT=$(grep -Po '"port":\s*\K\d+' /etc/orbit/config.json || echo "$PORT")
    PRIMARY_IP=$(grep -Po '"public_url":\s*"http://\K[^:]+' /etc/orbit/config.json || ip route get 1.1.1.1 2>/dev/null | grep -Po 'src \K[\d.]+' || echo "localhost")
    
    echo "═══════════════════════════════════════════════════════════"
    echo "  🌐 Panel URL: http://$PRIMARY_IP:$CONFIGURED_PORT"
    echo "  👤 Username:  $CONFIGURED_USERNAME"
    echo "  🔐 Password:  $CONFIGURED_USERNAME (change after first login)"
    echo "═══════════════════════════════════════════════════════════"
else
    PRIMARY_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -Po 'src \K[\d.]+' || echo "localhost")
    echo "Panel URL: http://$PRIMARY_IP:$PORT"
fi

echo
echo "Service management:"
echo "  • Status: systemctl status orbit"
echo "  • Logs:   journalctl -u orbit -f"
echo "  • Stop:   systemctl stop orbit"
echo "  • Start:  systemctl start orbit"
echo

