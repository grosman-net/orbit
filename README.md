# Orbit

Web panel for day-to-day Linux server administration on Ubuntu, Debian, and RHEL-family systems. The backend is a single Go binary with the UI embedded; there is no separate Node runtime for the panel itself.

Current release: **1.2.1**

## What it does

- System metrics (CPU, memory, disk, network) with charts
- APT package list, search, install, remove, upgrade
- systemd service control
- Network interfaces, routes, UFW firewall rules
- Local user management
- Editor for common config files (`sshd`, nginx, UFW, hosts, fstab) with a raw and a form-based mode
- Journal logs filtered by unit

## Requirements

- Linux with systemd
- root privileges (the service runs as root and calls system tools via `sudo -n`)
- Go 1.21+ only if you build from source

## Install

### APT (Ubuntu / Debian)

```bash
curl -fsSL https://grosman-net.github.io/orbit/install-orbitctl.sh | sudo bash
```

Or add the repository manually:

```bash
echo 'deb [trusted=yes] https://grosman-net.github.io/orbit stable main' | \
  sudo tee /etc/apt/sources.list.d/orbitctl.list
sudo apt update
sudo apt install orbitctl
```

### RPM (RHEL, CentOS, Rocky, Alma)

```bash
wget https://github.com/grosman-net/orbit/releases/download/v1.2.1/orbit-1.2.1-1.el8.x86_64.rpm
sudo rpm -ivh orbit-1.2.1-1.el8.x86_64.rpm
sudo orbit-setup
sudo systemctl enable --now orbit
```

### From source

```bash
git clone https://github.com/grosman-net/orbit.git
cd orbit
sudo ./install.sh
```

`install.sh` installs Go if needed, builds binaries, runs `orbit-setup`, and registers a systemd unit.

## First access

After install, open `http://<server-ip>:3333` (port is set during setup).

`orbit-setup` prints a one-time random password. On first login the panel asks for a new password (minimum 12 characters, mixed case, digit).

For production, put the panel behind HTTPS (nginx, Caddy, etc.) and restrict port 3333 with a firewall. See **Security** below.

## Configuration

File: `/etc/orbit/config.json`

```json
{
  "port": 3333,
  "bind_address": "0.0.0.0",
  "admin_username": "admin",
  "admin_password_hash": "$2a$10$...",
  "session_secret": "...",
  "public_url": "https://panel.example.com",
  "trusted_proxies": ["127.0.0.1", "::1"],
  "tls_cert": "",
  "tls_key": "",
  "first_login": false
}
```

| Field | Purpose |
|-------|---------|
| `public_url` | Used to mark session cookies `Secure` when the URL is `https://` |
| `trusted_proxies` | Only these hosts may set client IP via `X-Forwarded-For` / `X-Real-IP` |
| `tls_cert` / `tls_key` | Optional direct HTTPS (otherwise use a reverse proxy) |
| `bind_address` | Listen address (default `0.0.0.0`) |

Re-run `sudo orbit-setup` to change port or reset credentials (stop the service first).

## Security

Orbit is powerful by design: authenticated users can change system configuration. Treat it like SSH access to root.

Built-in measures (1.2.1):

- bcrypt password hashing
- Session cookies: HttpOnly, SameSite=Lax, Secure when served over HTTPS
- CSRF tokens on API mutations
- Login rate limiting (5 failures / 15 minutes per IP)
- Input validation on shell-invoked parameters
- Config syntax checks (`sshd -t`, `nginx -t`) before writing supported files
- Audit log at `/var/log/orbit/audit.log`
- Security headers (CSP, HSTS when TLS is detected)

Recommended deployment:

1. Reverse proxy with TLS and `trusted_proxies` including the proxy loopback IP.
2. Firewall: allow 3333 only from admin networks or VPN.
3. Strong unique admin password after install.
4. Keep the system and Orbit package updated.

## Development

```bash
make build          # orbit + orbit-setup
make run            # needs config.json and root for full API
go test ./...
```

## Uninstall

```bash
sudo apt purge orbitctl    # APT install
sudo ./uninstall.sh        # source install
```

## License

Apache License 2.0. See [LICENSE](LICENSE).

Project: https://github.com/grosman-net/orbit
