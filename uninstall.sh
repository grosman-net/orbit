#!/bin/bash
set -e

echo "=== Orbit Uninstallation ==="
echo

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Stop and disable service
if systemctl is-active --quiet orbit.service; then
    echo "Stopping orbit.service..."
    systemctl stop orbit.service
fi

if systemctl is-enabled --quiet orbit.service 2>/dev/null; then
    echo "Disabling orbit.service..."
    systemctl disable orbit.service
fi

# Remove systemd unit
if [ -f /etc/systemd/system/orbit.service ]; then
    echo "Removing systemd unit..."
    rm -f /etc/systemd/system/orbit.service
    systemctl daemon-reload
fi

# Remove binaries
echo "Removing binaries..."
rm -f /usr/local/bin/orbit
rm -f /usr/local/bin/orbit-setup

# Ask about config
echo
read -p "Remove configuration in /etc/orbit? [y/N]: " REMOVE_CONFIG
if [ "$REMOVE_CONFIG" = "y" ] || [ "$REMOVE_CONFIG" = "Y" ]; then
    echo "Removing /etc/orbit..."
    rm -rf /etc/orbit
else
    echo "Keeping configuration in /etc/orbit"
fi

echo
echo "=== Uninstallation Complete ==="
echo "Orbit has been removed from your system."

