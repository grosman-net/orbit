#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="orbit"
DEFAULT_INSTALL_DIR="/opt/orbit"
DEFAULT_USER="orbit"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}.service"

if [[ "${EUID}" -ne 0 ]]; then
  echo "This uninstaller must be run as root (sudo)." >&2
  exit 1
fi

read -r -p "Install directory [${DEFAULT_INSTALL_DIR}]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}
INSTALL_DIR="$(realpath -m "${INSTALL_DIR}")"

read -r -p "Service user [${DEFAULT_USER}]: " SERVICE_USER
SERVICE_USER=${SERVICE_USER:-$DEFAULT_USER}

echo "Stopping systemd service (if running)..."
systemctl stop "${SERVICE_NAME}.service" >/dev/null 2>&1 || true
systemctl disable "${SERVICE_NAME}.service" >/dev/null 2>&1 || true

if [[ -f "${SERVICE_PATH}" ]]; then
  rm -f "${SERVICE_PATH}"
fi
systemctl daemon-reload

if [[ -d "${INSTALL_DIR}" ]]; then
  rm -rf "${INSTALL_DIR}"
  echo "Removed ${INSTALL_DIR}"
else
  echo "Install directory ${INSTALL_DIR} not found, skipping removal."
fi

if id -u "${SERVICE_USER}" >/dev/null 2>&1; then
  read -r -p "Remove system user '${SERVICE_USER}'? [y/N]: " REMOVE_USER
  if [[ "${REMOVE_USER,,}" == "y" || "${REMOVE_USER,,}" == "yes" ]]; then
    userdel --remove "${SERVICE_USER}" || true
    echo "Removed user ${SERVICE_USER}"
  fi
fi

echo "Orbit has been uninstalled."

