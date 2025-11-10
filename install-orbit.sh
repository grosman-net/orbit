#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="orbit"
DEFAULT_INSTALL_DIR="/opt/orbit"
DEFAULT_USER="orbit"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}.service"

if [[ "${EUID}" -ne 0 ]]; then
  echo "This installer must be run as root (sudo)." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    echo "pnpm not found. Enabling via corepack..."
    corepack enable pnpm
  else
    echo "pnpm is required. Install pnpm or enable corepack before running the installer." >&2
    exit 1
  fi
fi

PNPM_BIN="$(command -v pnpm)"
echo "Using pnpm at ${PNPM_BIN}"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required but not installed. Install it with 'apt install rsync' and rerun the installer." >&2
  exit 1
fi

read -r -p "Install directory [${DEFAULT_INSTALL_DIR}]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}
INSTALL_DIR="$(realpath -m "${INSTALL_DIR}")"

read -r -p "Service user [${DEFAULT_USER}]: " SERVICE_USER
SERVICE_USER=${SERVICE_USER:-$DEFAULT_USER}

echo
echo "=== Installing dependencies ==="
"${PNPM_BIN}" install --frozen-lockfile

echo
echo "=== Running Orbit setup ==="
"${PNPM_BIN}" run setup

ENV_FILE="${REPO_ROOT}/.env.local"
if [[ ! -f "${ENV_FILE}" ]]; then
  echo ".env.local was not created. Aborting." >&2
  exit 1
fi

PORT="$(grep -E '^PORT=' "${ENV_FILE}" | tail -n1 | cut -d '=' -f2-)"
PORT=${PORT:-3333}
if ! [[ "${PORT}" =~ ^[0-9]+$ ]]; then
  echo "Invalid port value '${PORT}' in .env.local." >&2
  exit 1
fi

echo
echo "=== Building production bundle ==="
"${PNPM_BIN}" build

echo
echo "Stopping existing ${SERVICE_NAME}.service if present..."
systemctl stop "${SERVICE_NAME}.service" >/dev/null 2>&1 || true

echo
echo "=== Preparing install directory ${INSTALL_DIR} ==="
mkdir -p "${INSTALL_DIR}"
rm -rf "${INSTALL_DIR}/.cache"
rsync -a --delete \
  --exclude ".git" \
  --exclude ".vscode" \
  --exclude "node_modules" \
  --exclude ".pnpm-store" \
  --exclude ".cache" \
  "${REPO_ROOT}/" "${INSTALL_DIR}/"

cp "${ENV_FILE}" "${INSTALL_DIR}/.env.production"
rm -f "${INSTALL_DIR}/.env.local"

pushd "${INSTALL_DIR}" >/dev/null
echo
echo "=== Installing production dependencies in ${INSTALL_DIR} ==="
"${PNPM_BIN}" install --prod --frozen-lockfile
popd >/dev/null

if ! id -u "${SERVICE_USER}" >/dev/null 2>&1; then
  echo "Creating system user '${SERVICE_USER}'..."
  useradd --system --home "${INSTALL_DIR}" --shell /usr/sbin/nologin "${SERVICE_USER}"
fi

chown -R "${SERVICE_USER}:${SERVICE_USER}" "${INSTALL_DIR}"

cat >"${SERVICE_PATH}" <<EOF
[Unit]
Description=Orbit Server Management Panel
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${INSTALL_DIR}/.env.production
Environment=NODE_ENV=production
Environment=PORT=${PORT}
Environment=PATH=/usr/local/bin:/usr/bin:/bin
User=${SERVICE_USER}
Group=${SERVICE_USER}
ExecStart=/usr/bin/env node scripts/start.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo
echo "=== Enabling systemd service ${SERVICE_NAME}.service ==="
systemctl daemon-reload
systemctl disable "${SERVICE_NAME}.service" >/dev/null 2>&1 || true
systemctl enable --now "${SERVICE_NAME}.service"

PRIMARY_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [[ -z "${PRIMARY_IP}" ]]; then
  PRIMARY_IP="127.0.0.1"
fi

echo
echo "Orbit installed!"
echo "Service file: ${SERVICE_PATH}"
echo "Install dir : ${INSTALL_DIR}"
echo "Service user: ${SERVICE_USER}"
echo
echo "Panel is available at: http://${PRIMARY_IP}:${PORT}"
echo "Use the administrator credentials configured during setup."

