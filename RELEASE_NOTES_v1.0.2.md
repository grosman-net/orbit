# Orbit v1.0.2 - Zero-Prerequisites Installation 🚀

**Release Date**: November 10, 2025  
**Type**: Patch Release (Enhancement)  
**Platform**: Ubuntu 20.04+ / Debian 11+  
**Architecture**: amd64, arm64

---

## 🎯 What's New

**Fully Automated Installation** - No more manual Go setup!

### Before (v1.0.1)
```bash
# User had to manually install Go first
wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
# Then clone and install
git clone https://github.com/grosman-net/orbit.git
cd orbit
sudo ./install.sh
```

### Now (v1.0.2)
```bash
# Just clone and run - that's it!
git clone https://github.com/grosman-net/orbit.git
cd orbit
sudo ./install.sh
# ✅ Script automatically installs Go if needed
# ✅ Script automatically upgrades old Go versions
# ✅ Script automatically installs wget if needed
```

---

## ✨ Features

### Automatic Go Installation
- 📥 **Auto-downloads Go 1.23.0** if not present
- 🔄 **Auto-upgrades** if existing Go version < 1.21
- 🛠️ **Auto-installs dependencies** (wget)
- 🔧 **Auto-configures PATH** in `/etc/profile` and `~/.bashrc`
- ✅ **Zero manual steps** required

### Smart Detection
The installer now intelligently handles three scenarios:

1. **Pre-built binaries present** → Use them directly
2. **Go already installed (1.21+)** → Build from source
3. **Go missing or too old** → Install/upgrade Go, then build

---

## 📦 Installation

### Quick Install (Completely Automated)

```bash
git clone https://github.com/grosman-net/orbit.git
cd orbit
sudo ./install.sh
```

**What happens automatically:**
```
1. Detecting architecture...           ✓
2. Checking for Go...                  ✗ Not found
3. Installing wget...                  ✓
4. Downloading Go 1.23.0...            ✓
5. Installing Go to /usr/local/go...   ✓
6. Adding Go to PATH...                ✓
7. Building Orbit from source...       ✓
8. Running setup wizard...             ✓
9. Creating systemd service...         ✓
10. Starting Orbit...                  ✓
```

---

## 🔄 Upgrade from v1.0.0 / v1.0.1

If you're already running Orbit:

```bash
cd /path/to/orbit
git pull origin main
sudo systemctl stop orbit
sudo ./install.sh
```

The installer will detect your existing Go installation and use it (or upgrade if needed).

---

## 📥 Download

**Linux amd64** (Intel/AMD 64-bit):
```
orbit-1.0.2-linux-amd64.tar.gz
SHA256: 82c00582e1eaa6aa6bede4f018e930bd73b7ef64cb59a003c33c98caac3ae65a
```

**Linux arm64** (ARM 64-bit):
```
orbit-1.0.2-linux-arm64.tar.gz
SHA256: 20dfcf358c4becdcbf3cdf8959b4113702e2835ff936323522d61b65e4e0b83f
```

---

## 📋 Full Changelog

See [CHANGELOG.md](CHANGELOG.md#102---2025-11-10) for complete details.

### Added
- Automatic Go 1.23.0 installation in `install.sh`
- Automatic Go version upgrade if < 1.21
- Automatic wget installation if missing
- PATH configuration in system and user profiles

### Changed
- Installation now requires **zero prerequisites**
- Single command installation from git clone

### Documentation
- Updated README.md with new automated installation flow
- Updated version badge

---

## 🎓 Example Installation Log

```bash
root@server:~# git clone https://github.com/grosman-net/orbit.git
root@server:~# cd orbit
root@server:~/orbit# sudo ./install.sh

=== Orbit Installation ===

Detected architecture: x86_64 (amd64)
Go not found, installing automatically...

=== Installing Go 1.23.0 ===
Downloading Go 1.23.0...
go1.23.0.linux-amd64 100%[===================>]  67.1M  50.2MB/s    in 1.3s    
Installing Go to /usr/local/go...
✓ Go go1.23.0 installed successfully

=== Building Orbit from source ===
Building main binary...
Building setup utility...

=== Installing to /usr/local/bin ===
✓ Installed orbit
✓ Installed orbit-setup

=== Initial Configuration ===
HTTP port [3333]: 8080
Admin username [admin]: admin
Set administrator password: ******
Confirm password: ******
Public URL for the panel [http://192.168.1.100:8080]: 

✓ Configuration saved to: /etc/orbit/config.json

=== Creating systemd service ===
✓ Service created
✓ Service enabled
✓ Service started

=== Installation Complete ===

Panel URL: http://192.168.1.100:8080

Use the credentials configured during setup to log in.
```

---

## 🔍 Technical Details

### What the installer does

1. **Architecture Detection**: Automatically detects amd64/arm64
2. **Binary Check**: Looks for pre-built `orbit` and `orbit-setup`
3. **Go Check**: 
   - If Go not found → Install Go 1.23.0
   - If Go < 1.21 → Upgrade to Go 1.23.0
   - If Go >= 1.21 → Use existing installation
4. **Dependency Check**: Installs `wget` via apt if missing
5. **Build**: Compiles Orbit from source with optimizations
6. **Setup**: Runs interactive configuration wizard
7. **Service**: Creates and starts systemd unit
8. **PATH**: Adds Go to system PATH for future use

### Files Modified
- `/usr/local/go/` - Go installation
- `/usr/local/bin/orbit` - Main binary
- `/usr/local/bin/orbit-setup` - Setup utility
- `/etc/orbit/config.json` - Configuration
- `/etc/systemd/system/orbit.service` - Systemd unit
- `/etc/profile` - Go PATH (system-wide)
- `~/.bashrc` - Go PATH (user-specific)

---

## 💡 Why This Matters

**User Experience**: One command to rule them all
- No reading INSTALL.md
- No downloading Go manually
- No troubleshooting PATH issues
- No prerequisite confusion

**System Administrators**: Deploy faster
- Clone repo on fresh Ubuntu server
- Run install script
- Done in 2 minutes

**CI/CD**: Scriptable installation
- Works in Docker
- Works in automation
- Idempotent (safe to re-run)

---

## 🙏 Feedback

This release addresses user feedback about installation complexity. Thank you for helping us improve!

**Made with ❤️ for system administrators**

