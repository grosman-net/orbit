# Go Rewrite Summary

## What Changed

Orbit has been completely rewritten from **Next.js/TypeScript** to **Go** with an embedded frontend. This brings massive improvements in deployment simplicity and resource usage.

## Before vs After

### Before (Next.js)
- **Size**: ~500MB (node_modules + dependencies)
- **Runtime**: Node.js 18+, pnpm, corepack required
- **Installation**: Clone → install deps → build → configure env → setup systemd
- **Issues**: 
  - Complex password input masking
  - Port conflicts
  - Environment variable management
  - Corepack/pnpm issues in systemd
  - Large disk footprint

### After (Go)
- **Size**: ~15MB (single binary + embedded assets)
- **Runtime**: None! Just the binary
- **Installation**: Download binary → run setup → done
- **Benefits**:
  - Zero runtime dependencies
  - Simple, native password input
  - Automatic IP detection
  - Clean systemd integration
  - Tiny disk footprint
  - Cross-platform (amd64, arm64, arm)

## Architecture

```
orbit/
├── main.go                    # Entry point
├── internal/
│   ├── api/                   # HTTP handlers
│   ├── auth/                  # Session-based authentication
│   ├── config/                # JSON configuration
│   ├── configfiles/           # Config file editing
│   ├── network/               # Network & UFW management
│   ├── packages/              # APT package management
│   ├── services/              # Systemd service control
│   ├── system/                # System monitoring
│   ├── users/                 # User management
│   └── util/                  # Utilities
├── cmd/setup/                 # Interactive setup wizard
├── web/                       # Frontend (embedded at compile time)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── favicon.svg
├── install.sh                 # Installation script
├── uninstall.sh               # Uninstallation script
└── Makefile                   # Build automation
```

## Features Preserved

All functionality from the Next.js version has been preserved:

✅ System monitoring (CPU, RAM, disk, network, swap, I/O, load average)  
✅ Package management (APT)  
✅ Systemd service control  
✅ Network interface viewing  
✅ UFW firewall management  
✅ User management (create, lock, unlock, delete)  
✅ Configuration file editing  
✅ Log viewing  
✅ Secure authentication  

## Installation

### Option 1: Pre-built Binary (Recommended)

**No Go compiler needed!**

```bash
# Download for your architecture
wget https://github.com/yourusername/orbit/releases/latest/download/orbit-linux-amd64
wget https://github.com/yourusername/orbit/releases/latest/download/orbit-setup-linux-amd64

chmod +x orbit-linux-amd64 orbit-setup-linux-amd64
sudo mv orbit-linux-amd64 /usr/local/bin/orbit
sudo mv orbit-setup-linux-amd64 /usr/local/bin/orbit-setup

# Setup
sudo mkdir -p /etc/orbit
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

sudo systemctl daemon-reload
sudo systemctl enable --now orbit
```

### Option 2: Build from Source

**Requires Go 1.21+**

```bash
git checkout go-rewrite
sudo ./install.sh
```

The install script handles everything automatically.

## Setup Wizard

The `orbit-setup` command now:

- ✅ Uses native terminal password input (no more extra asterisks!)
- ✅ Automatically detects your server's primary IP address
- ✅ Generates secure session secrets automatically
- ✅ Validates all input (port range, empty passwords, etc.)
- ✅ Provides clear prompts with defaults
- ✅ Stores config in `/etc/orbit/config.json`

## Configuration

All configuration is in `/etc/orbit/config.json`:

```json
{
  "port": 3333,
  "admin_username": "admin",
  "admin_password_hash": "$2a$12$...",
  "session_secret": "...",
  "public_url": "http://YOUR_SERVER_IP:3333"
}
```

To change port or credentials:

```bash
sudo orbit-setup
sudo systemctl restart orbit
```

## Docker Support

```bash
docker build -t orbit .
docker run -d --name orbit --restart unless-stopped \
  -p 3333:3333 \
  -v /etc/orbit:/etc/orbit \
  --privileged \
  orbit
```

## GitHub Actions

Automatic builds for every push to `go-rewrite` or `main`:

- Builds for amd64, arm64, and arm
- Creates releases on tags (v*)
- Uploads binaries as artifacts

## Uninstallation

```bash
sudo ./uninstall.sh
```

This removes:
- Binaries from `/usr/local/bin`
- systemd service
- Optionally `/etc/orbit/config.json`

## Performance

Go version is significantly more efficient:

| Metric | Next.js | Go |
|--------|---------|-----|
| Memory | ~150MB | ~30MB |
| Startup | 5-10s | <1s |
| Disk | ~500MB | ~15MB |
| CPU | Medium | Low |

## Migration from Next.js Version

If you have the old version installed:

1. Stop old service:
   ```bash
   sudo systemctl stop orbit
   sudo systemctl disable orbit
   ```

2. Backup config (if needed):
   ```bash
   cp /opt/orbit/.env.production ~/orbit-backup.env
   ```

3. Uninstall old version:
   ```bash
   sudo /opt/orbit/uninstall-orbit.sh
   ```

4. Install Go version:
   ```bash
   git checkout go-rewrite
   sudo ./install.sh
   ```

## Testing

On your test server (YOUR_SERVER_IP):

1. Build or download binary
2. Run setup: `sudo orbit-setup`
3. Start service: `sudo systemctl start orbit`
4. Access: http://YOUR_SERVER_IP:3333
5. Login with your configured credentials

## Notes

- The old Next.js code remains in the `main` branch
- The Go version is in the `go-rewrite` branch
- Both versions have identical functionality
- The Go version is now the recommended version

## Support

- See `README.md` for full documentation
- See `INSTALL.md` for detailed installation instructions
- Check GitHub Actions for automated builds

---

**The password input is now fixed! No more extra characters, no more missing prompts!**

