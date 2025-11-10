# Orbit v1.0.1 - Bugfix Release 🔧

**Release Date**: November 10, 2025  
**Type**: Patch Release (Bugfix)  
**Platform**: Ubuntu 20.04+ / Debian 11+  
**Architecture**: amd64, arm64

---

## 🐛 Critical Fix

This release fixes a critical installation issue in v1.0.0 where release archives were not structured correctly.

### Problem in v1.0.0
- ❌ Archive extracted files directly into current directory
- ❌ Binary names didn't match what `install.sh` expected
- ❌ Installation failed with "Neither pre-built binaries found nor Go installed"

### Fixed in v1.0.1
- ✅ Archives now extract to proper directory: `orbit-1.0.1-linux-amd64/`
- ✅ Binary names normalized: `orbit` and `orbit-setup`
- ✅ `install.sh` correctly locates and installs binaries
- ✅ All files have correct permissions (chmod +x)

---

## 📦 Installation

### Quick Install (Fixed)

```bash
# Download
wget https://github.com/grosman-net/orbit/releases/download/v1.0.1/orbit-1.0.1-linux-amd64.tar.gz

# Extract (now creates proper directory)
tar xzf orbit-1.0.1-linux-amd64.tar.gz

# Install
cd orbit-1.0.1-linux-amd64
sudo ./install.sh
```

### What Changed

**Before (v1.0.0)**:
```bash
$ tar xzf orbit-1.0.0-linux-amd64.tar.gz
$ ls
orbit-1.0.0-linux-amd64  orbit-setup-1.0.0-linux-amd64  web/  install.sh  ...
# Files scattered in current directory ❌
```

**After (v1.0.1)**:
```bash
$ tar xzf orbit-1.0.1-linux-amd64.tar.gz
$ ls
orbit-1.0.1-linux-amd64/
$ cd orbit-1.0.1-linux-amd64
$ ls
orbit  orbit-setup  web/  install.sh  uninstall.sh  README.md  LICENSE  CHANGELOG.md
# Clean directory structure ✅
```

---

## 🔄 Upgrade from v1.0.0

If you manually worked around the v1.0.0 installation issue, you can upgrade:

```bash
# Stop current service
sudo systemctl stop orbit

# Download v1.0.1
wget https://github.com/grosman-net/orbit/releases/download/v1.0.1/orbit-1.0.1-linux-amd64.tar.gz
tar xzf orbit-1.0.1-linux-amd64.tar.gz
cd orbit-1.0.1-linux-amd64

# Replace binaries
sudo cp orbit /usr/local/bin/orbit
sudo cp orbit-setup /usr/local/bin/orbit-setup

# Restart service
sudo systemctl start orbit
```

---

## 📋 Full Changelog

See [CHANGELOG.md](CHANGELOG.md#101---2025-11-10) for details.

---

## 📥 Download

**Linux amd64** (Intel/AMD 64-bit):
```
orbit-1.0.1-linux-amd64.tar.gz
SHA256: e547a3ab474192893123de75ded29e6ac4c56b0b6e31ded8a2b2d10b9ae02d6e
```

**Linux arm64** (ARM 64-bit):
```
orbit-1.0.1-linux-arm64.tar.gz
SHA256: fbdabf4221eb4192524b3f70ee701e9d128449027a569ea5866839e606b9ed83
```

---

## 🔍 Verification

After installation, verify:

```bash
orbit --version  # Should show: Orbit v1.0.1
sudo systemctl status orbit  # Should be active (running)
```

---

## 💡 Note

This is a **patch release** that only fixes the installation packaging. No functional changes to the application itself. All features from v1.0.0 remain the same.

---

## 🙏 Thank You

Thank you for reporting the installation issue! Your feedback helps make Orbit better.

**Made with ❤️ for system administrators**

