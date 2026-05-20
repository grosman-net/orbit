#!/bin/bash
# Orbit universal installer (APT on Debian/Ubuntu, RPM on RHEL family)

set -e

REPO_URL="https://grosman-net.github.io/orbit"
GITHUB_RELEASES="https://github.com/grosman-net/orbit/releases/latest"

echo "Orbit installer"
echo "==============="
echo ""

if [ "$EUID" -ne 0 ]; then
    echo "Error: run as root (sudo $0)"
    exit 1
fi

if [ ! -f /etc/os-release ]; then
    echo "Error: unsupported system (no /etc/os-release)"
    exit 1
fi

. /etc/os-release
echo "Detected: $NAME $VERSION"
echo ""

if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
else
    echo "Error: need apt, dnf, or yum"
    exit 1
fi

echo "Package manager: $PKG_MANAGER"
echo ""

if [ "$PKG_MANAGER" = "apt" ]; then
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        echo "Error: APT is only supported on Ubuntu/Debian"
        exit 1
    fi

    SOURCES_FILE="/etc/apt/sources.list.d/orbitctl.list"
    echo "Adding APT repository..."
    echo "deb [trusted=yes] ${REPO_URL} stable main" > "${SOURCES_FILE}"
    apt-get update -qq
    apt-get install -y orbitctl

elif [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
    ARCH=$(uname -m)
    case $ARCH in
        x86_64) RPM_ARCH="x86_64" ;;
        aarch64) RPM_ARCH="aarch64" ;;
        *) echo "Error: unsupported architecture: $ARCH"; exit 1 ;;
    esac

    echo "Fetching latest release..."
    LATEST_VERSION=$(curl -fsSL "${GITHUB_RELEASES}" | grep -oP 'tag/v\K[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    if [ -z "$LATEST_VERSION" ]; then
        LATEST_VERSION="1.2.1"
        echo "Warning: using fallback version ${LATEST_VERSION}"
    else
        echo "Version: ${LATEST_VERSION}"
    fi

    RPM_URL="${GITHUB_RELEASES}/download/v${LATEST_VERSION}/orbit-${LATEST_VERSION}-1.el8.${RPM_ARCH}.rpm"
    RPM_FILE="/tmp/orbit-${LATEST_VERSION}.rpm"

    echo "Downloading ${RPM_URL}"
    if ! curl -fsSL -o "${RPM_FILE}" "${RPM_URL}"; then
        echo "Error: download failed"
        exit 1
    fi

    if [ "$PKG_MANAGER" = "dnf" ]; then
        dnf install -y "${RPM_FILE}"
    else
        yum install -y "${RPM_FILE}"
    fi
    rm -f "${RPM_FILE}"
else
    echo "Error: unsupported package manager"
    exit 1
fi

echo ""
echo "Orbit installed."
echo ""
echo "Next:"
echo "  sudo orbit-setup"
echo "  sudo systemctl enable --now orbit"
echo "  open http://<server-ip>:3333"
