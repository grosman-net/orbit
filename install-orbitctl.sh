#!/bin/bash
# Orbit Universal Installer (APT/RPM)

set -e

REPO_URL="https://grosman-net.github.io/orbit"
GITHUB_RELEASES="https://github.com/grosman-net/orbit/releases/latest"

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
    echo "❌ Cannot detect OS. Unsupported system."
    exit 1
fi

. /etc/os-release

echo "✓ Detected: $NAME $VERSION"
echo ""

# Detect package manager
if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
else
    echo "❌ Unsupported package manager. This script requires APT, DNF, or YUM."
    exit 1
fi

echo "✓ Using package manager: $PKG_MANAGER"
echo ""

# Install based on package manager
if [ "$PKG_MANAGER" = "apt" ]; then
    # Debian/Ubuntu installation
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        echo "❌ APT detected but OS is not Ubuntu/Debian."
        exit 1
    fi
    
    SOURCES_FILE="/etc/apt/sources.list.d/orbitctl.list"
    
    echo "=== Adding Orbit APT Repository ==="
    echo ""
    
    # Create sources list
    echo "deb [trusted=yes] ${REPO_URL} stable main" > ${SOURCES_FILE}
    
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
    
elif [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
    # RHEL/CentOS/Rocky/Fedora installation
    echo "=== Installing Orbit from RPM package ==="
    echo ""
    
    # Detect architecture
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            RPM_ARCH="x86_64"
            ;;
        aarch64)
            RPM_ARCH="aarch64"
            ;;
        *)
            echo "❌ Unsupported architecture: $ARCH"
            exit 1
            ;;
    esac
    
    echo "✓ Architecture: $RPM_ARCH"
    echo ""
    
    # Get latest version from GitHub
    echo "=== Fetching latest version ==="
    LATEST_VERSION=$(curl -sL ${GITHUB_RELEASES} | grep -oP 'tag/v\K[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    
    if [ -z "$LATEST_VERSION" ]; then
        echo "⚠️  Could not fetch latest version, using fallback: 1.2.0"
        LATEST_VERSION="1.2.0"
    else
        echo "✓ Latest version: $LATEST_VERSION"
    fi
    echo ""
    
    # Download RPM
    RPM_URL="${GITHUB_RELEASES}/download/v${LATEST_VERSION}/orbit-${LATEST_VERSION}-1.el8.${RPM_ARCH}.rpm"
    RPM_FILE="/tmp/orbit-${LATEST_VERSION}.rpm"
    
    echo "=== Downloading Orbit RPM package ==="
    if ! curl -sL -o "${RPM_FILE}" "${RPM_URL}"; then
        echo "❌ Failed to download RPM package"
        echo "   URL: ${RPM_URL}"
        echo ""
        echo "   You can download manually from:"
        echo "   ${GITHUB_RELEASES}"
        exit 1
    fi
    
    echo "✓ Package downloaded: ${RPM_FILE}"
    echo ""
    
    # Install RPM
    echo "=== Installing Orbit ==="
    if [ "$PKG_MANAGER" = "dnf" ]; then
        dnf install -y "${RPM_FILE}"
    else
        yum install -y "${RPM_FILE}"
    fi
    
    # Cleanup
    rm -f "${RPM_FILE}"
    
else
    echo "❌ Unsupported package manager: $PKG_MANAGER"
    exit 1
fi

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

