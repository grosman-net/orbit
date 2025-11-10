#!/bin/bash
# Orbit APT Repository Setup Script

set -e

REPO_URL="https://grosman-net.github.io/orbit"
SOURCES_FILE="/etc/apt/sources.list.d/orbitctl.list"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║         Orbit Server Management Panel Installer          ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root"
    echo "   Please run: sudo $0"
    exit 1
fi

# Check OS
if [ ! -f /etc/os-release ]; then
    echo "❌ Cannot detect OS. This script is for Ubuntu/Debian only."
    exit 1
fi

. /etc/os-release

if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
    echo "❌ This script is for Ubuntu/Debian only."
    echo "   Detected: $NAME"
    exit 1
fi

echo "✓ Detected: $NAME $VERSION"
echo ""

# Add repository
echo "=== Adding Orbit APT Repository ==="
echo ""

# Create sources list
echo "deb [trusted=yes] ${REPO_URL}/apt-repo stable main" > ${SOURCES_FILE}

echo "✓ Repository added: ${SOURCES_FILE}"
echo ""

# Update package lists
echo "=== Updating package lists ==="
apt-get update -qq

echo "✓ Package lists updated"
echo ""

# Install orbit (provides orbitctl)
echo "=== Installing Orbit ==="
apt-get install -y orbitctl

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║         ✅ Orbit installed successfully!                 ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "  1. Configure Orbit:"
echo "     sudo orbit-setup"
echo ""
echo "  2. Enable and start the service:"
echo "     sudo systemctl enable orbit"
echo "     sudo systemctl start orbit"
echo ""
echo "  3. Access the panel:"
echo "     http://your-server-ip:3333"
echo ""
echo "═══════════════════════════════════════════════════════════"

