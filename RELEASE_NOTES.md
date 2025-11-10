# Orbit Release Notes

This file contains release notes for all versions of Orbit.

---

## v1.0.5 - Installation Upgrade Fix (2025-11-10)

**Type**: Patch Release (Bugfix)  
**Platform**: Ubuntu 20.04+ / Debian 11+  
**Architecture**: amd64, arm64

### 🐛 Fixed

**"Text file busy" Error on Upgrade**

When running `sudo ./install.sh` on a system where Orbit was already installed and running, the installation would fail with:

```
cp: cannot create regular file '/usr/local/bin/orbit': Text file busy
```

**Root Cause**: The running `orbit` binary cannot be replaced while in use by the systemd service.

**Solution**: The installer now automatically stops the service before replacing binaries, then restarts it after installation completes.

### Installation

```bash
git clone https://github.com/grosman-net/orbit.git
cd orbit
sudo ./install.sh
# ✅ Now works perfectly for both fresh installs AND upgrades
```

### What Changed

**Before (v1.0.4)**:
```bash
sudo ./install.sh
# ❌ Error: Text file busy (if orbit service was running)
```

**After (v1.0.5)**:
```bash
sudo ./install.sh
# ✅ Automatically stops service
# ✅ Replaces binaries
# ✅ Restarts service
# ✅ Success!
```

### Upgrade from v1.0.4

Simply pull and install:

```bash
cd /path/to/orbit
git pull origin main
sudo ./install.sh
# ✅ Works now!
```

---

## v1.0.4 - First Login Password Change (2025-11-10)

**Type**: Minor Release (Feature Enhancement)  
**Platform**: Ubuntu 20.04+ / Debian 11+  
**Architecture**: amd64, arm64

### 🎯 What's New

**Mandatory Password Change on First Login** - Enhanced security with forced password change

### Features

#### 🔐 First Login Password Change
- ✅ **Default credentials**: Username = Password (e.g., `admin:admin`)
- ✅ **Mandatory change**: Modal appears on first login forcing password change
- ✅ **Persistent flag**: `first_login` in config.json tracks status
- ✅ **Secure flow**: Cannot access panel until password is changed
- ✅ **User-friendly**: Clear instructions like Grafana default password flow

#### 📋 API Endpoints
- `GET /api/auth/first-login` - Check if first login
- `POST /api/auth/change-password` - Change password

#### 🎨 UI Improvements
- Beautiful modal with blur backdrop
- Password validation (min 4 chars, must match)
- Cannot close modal on forced change
- Optional password change from settings (coming soon)

### Fixed Bugs

1. ✅ **main.go**: Port flag now defaults to 0, only overrides config if explicitly set
2. ✅ **main.go**: Removed Default() config fallback, now exits if config missing
3. ✅ **util.go**: Fixed GenerateRandomString entropy (was half, now full)
4. ✅ **install.sh**: Removed hardcoded `--port 3333` from systemd unit
5. ✅ **cmd/setup**: Removed TrimSpace from password input to prevent mismatches

### Installation

```bash
git clone https://github.com/grosman-net/orbit.git
cd orbit
sudo ./install.sh
```

**First login:**
1. Use credentials from setup (default: `admin:admin`)
2. Mandatory password change modal appears
3. Enter current password and new password
4. Access panel after successful change

### Upgrade from v1.0.3

```bash
cd /path/to/orbit
git pull origin main
sudo systemctl stop orbit
make build
sudo cp orbit orbit-setup /usr/local/bin/
sudo systemctl start orbit
```

**Note**: Existing installations won't trigger the first login modal unless you recreate `config.json` with `orbit-setup`.

---

## v1.0.3 - Critical Bugfix for Auto-Installation (2025-11-10)

**Type**: Patch Release (Critical Bugfix)

### Fixed

- ✅ Critical bug in `install.sh` where Go installation left script in `/tmp`
- ✅ Build failure: "go.mod file not found" error
- ✅ Directory context lost after automatic Go installation

### Technical Changes

- Added `local ORIG_DIR="$(pwd)"` to save directory before `cd /tmp`
- Added `cd "$ORIG_DIR"` to restore directory after Go installation
- Removed redundant `cd "$(dirname "$0")"`

**Impact**: Fixed installation for 100% of users on systems without Go 1.21+

---

## v1.0.2 - Zero-Prerequisites Installation (2025-11-10)

**Type**: Patch Release (Enhancement)

### Added

- 📥 **Automatic Go 1.23.0 installation** if not present
- 🔄 **Automatic Go upgrade** if existing version < 1.21
- 🛠️ **Automatic wget installation** if missing
- 🔧 **Automatic PATH configuration** in `/etc/profile` and `~/.bashrc`
- ✅ **Zero manual steps** required

### Changed

- Installation now requires **zero prerequisites**
- Single command installation from git clone

**Note**: v1.0.2 had a critical bug fixed in v1.0.3

---

## v1.0.1 - Bugfix Release (2025-11-10)

**Type**: Patch Release (Bugfix)

### Fixed

- ✅ Archive structure: Now extracts to proper directory `orbit-1.0.1-linux-amd64/`
- ✅ Binary names normalized: `orbit` and `orbit-setup`
- ✅ `install.sh` correctly locates and installs binaries
- ✅ All files have correct permissions (chmod +x)

**Problem in v1.0.0**: Archives extracted files directly into current directory causing installation failures.

---

## v1.0.0 - First Stable Release (2025-11-10)

**Type**: Major Release  
**Platform**: Ubuntu 20.04+ / Debian 11+  
**Architecture**: amd64, arm64

### 🌟 Highlights

Orbit is a modern, lightweight server management panel built with Go. This first stable release provides a complete set of tools for managing Ubuntu/Debian servers through an intuitive web interface.

### ✨ Key Features

- **Real-time System Monitoring** with interactive charts
- **Package Management** (APT) - install, remove, update
- **Service Control** (systemd) - start, stop, restart, enable/disable
- **Network Configuration** with netplan persistence
- **User Management** - create, lock, delete users
- **Interactive Config Editor** for SSH, UFW, Nginx
- **System Logs Viewer** with filtering
- **Secure Authentication** with bcrypt + sessions

### 🎨 Modern UI

- Dark theme with glassmorphism effects
- Mint-emerald gradient accents
- Responsive design (mobile & desktop)
- Real-time charts with Chart.js
- Smooth animations and transitions

### 🔒 Security

- ✅ Fixed shell injection vulnerability in netplan config generation
- ✅ Added input validation for interface names and package names
- ✅ Implemented proper file writing instead of shell commands
- ✅ Added data validation for all API responses

### 📋 Requirements

**System**:
- Ubuntu 20.04 LTS or newer
- Debian 11 or newer
- 512 MB RAM minimum (1 GB recommended)
- 50 MB disk space

**Runtime**:
- Go 1.21+ (for building from source)
- systemd
- APT package manager
- netplan (for persistent network config)

### 🚀 Roadmap

**Planned for v1.1.0**:
- RHEL/CentOS/Rocky Linux support
- Docker container management
- Two-factor authentication
- WebSocket for real-time updates

**Future**:
- Backup and restore functionality
- Multi-user support with roles
- Nginx virtual host editor
- SSL certificate management
- Cron job management
- File manager

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

**Author**: grosman-net

---

## 🙏 Thank You

Thank you to everyone who tested and provided feedback during development!

**Made with ❤️ for system administrators**

