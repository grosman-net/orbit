# Orbit v1.0.3 - Critical Bugfix for Auto-Installation 🔧

**Release Date**: November 10, 2025  
**Type**: Patch Release (Critical Bugfix)  
**Platform**: Ubuntu 20.04+ / Debian 11+  
**Architecture**: amd64, arm64

---

## 🐛 Critical Bug Fixed

This release fixes a critical bug in v1.0.2 where the automatic Go installation would fail during the build phase.

### Problem in v1.0.2

When running `sudo ./install.sh` on a system without Go:

```bash
=== Installing Go 1.23.0 ===
Downloading Go 1.23.0...
Installing Go to /usr/local/go...
✓ Go go1.23.0 installed successfully

=== Building Orbit from source ===
go: warning: ignoring go.mod in system temp root /tmp
go: go.mod file not found in current directory or any parent directory
```

**Root Cause**: The `install_go()` function changed directory to `/tmp` to download Go, but never returned to the original project directory. Subsequent build commands failed because they couldn't find `go.mod`.

### Fixed in v1.0.3

- ✅ `install_go()` now saves current directory before changing to `/tmp`
- ✅ Returns to original directory after Go installation completes
- ✅ Build now executes in correct project directory
- ✅ Installation completes successfully end-to-end

---

## 🔧 Technical Details

### Code Changes

**Before (v1.0.2)**:
```bash
install_go() {
    echo "Downloading Go 1.23.0..."
    cd /tmp
    wget ...
    tar ...
    rm ...
    # Oops - still in /tmp!
}
```

**After (v1.0.3)**:
```bash
install_go() {
    local ORIG_DIR="$(pwd)"  # Save current dir
    
    echo "Downloading Go 1.23.0..."
    cd /tmp
    wget ...
    tar ...
    rm ...
    
    cd "$ORIG_DIR"  # Return to original dir
}
```

### Files Modified
- `install.sh` - Fixed directory handling in `install_go()`

---

## 📦 Installation

### Quick Install (Now Working!)

```bash
git clone https://github.com/grosman-net/orbit.git
cd orbit
sudo ./install.sh
```

### What Happens Now

```bash
=== Orbit Installation ===

Detected architecture: x86_64 (amd64)
Go not found, installing automatically...

=== Installing Go 1.23.0 ===
Downloading Go 1.23.0...
go1.23.0.linux-amd64.tar.gz   100%[========>]  70.18M  22.2MB/s
Installing Go to /usr/local/go...
✓ Go go1.23.0 installed successfully

=== Building Orbit from source ===    ✅ Now works!
Building main binary...
Building setup utility...

=== Installing to /usr/local/bin ===
✓ Installed orbit
✓ Installed orbit-setup

=== Initial Configuration ===
HTTP port [3333]: 
...
```

---

## 🔄 Upgrade from v1.0.2

If you hit the bug in v1.0.2, simply pull the latest changes:

```bash
cd /path/to/orbit
git pull origin main
sudo ./install.sh
```

The installer will now complete successfully.

---

## 📋 Full Changelog

See [CHANGELOG.md](CHANGELOG.md#103---2025-11-10) for complete details.

### Fixed
- Critical bug in `install.sh` where Go installation left script in `/tmp`
- Build failure: "go.mod file not found" error
- Directory context lost after automatic Go installation

### Technical
- Added `local ORIG_DIR="$(pwd)"` to save directory before `cd /tmp`
- Added `cd "$ORIG_DIR"` to restore directory after Go installation
- Removed redundant `cd "$(dirname "$0")"` (no longer needed)

---

## 📥 Download

**Linux amd64** (Intel/AMD 64-bit):
```
orbit-1.0.3-linux-amd64.tar.gz
SHA256: 81a4ddf3e0084165bc171281c69a9ded43ced7f1d1e7fac84e452b34e0ed0a96
```

**Linux arm64** (ARM 64-bit):
```
orbit-1.0.3-linux-arm64.tar.gz
SHA256: 1584051accde6e4438a651ba5df68707770185e9b85055f4a0e68bbd8e7e7e70
```

---

## 🧪 Testing

Verified on clean Ubuntu 22.04 system:
- ✅ Fresh install without Go → Auto-installs Go → Builds successfully
- ✅ Install with old Go (< 1.21) → Upgrades Go → Builds successfully  
- ✅ Install with Go 1.23+ → Uses existing → Builds successfully
- ✅ All build commands execute in correct directory
- ✅ Service starts and runs correctly

---

## 💡 Impact

This bug affected **100% of users** installing on systems without Go 1.21+:
- v1.0.2: Installation would fail at build stage
- v1.0.3: Installation completes successfully

**Severity**: Critical  
**Priority**: Immediate upgrade recommended

---

## 📊 Version History

- **v1.0.0**: Initial Go release
- **v1.0.1**: Fixed release archive structure
- **v1.0.2**: Added automatic Go installation (but broken)
- **v1.0.3**: Fixed automatic Go installation ✅ **← Use this version**

---

## 🙏 Thank You

Thank you for reporting this critical issue! Your testing helps make Orbit better.

**Made with ❤️ for system administrators**

