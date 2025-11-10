# Orbit v1.1.0 - APT Repository Support 🎉

**Release Date:** November 10, 2025

## 🚀 Major Features

### APT Repository Installation
Orbit is now available via APT repository hosted on GitHub Pages! This provides the easiest installation and update experience.

**One-line installation:**
```bash
curl -fsSL https://grosman-net.github.io/orbit/install-orbitctl.sh | sudo bash
```

**Or via APT:**
```bash
echo 'deb [trusted=yes] https://grosman-net.github.io/orbit stable main' | \
  sudo tee /etc/apt/sources.list.d/orbitctl.list
sudo apt update
sudo apt install orbitctl
```

### Interactive Installation
- Automatically prompts for HTTP port (default: 3333)
- Automatically prompts for admin username (default: admin)
- Password defaults to username (change after first login)
- Service automatically enabled and started
- Shows access URL and credentials after installation

### Automatic Updates
```bash
sudo apt update
sudo apt upgrade
```

## 🐛 Bug Fixes

### APT Repository Format
- Fixed `Release` file format to include file sizes (required by APT spec)
- Proper format: `<hash> <size> <path>` for MD5Sum/SHA256 entries
- Resolved "Unable to parse package file" error
- Fixed "Conflicting distribution" warning

## 🔧 Technical Changes

### Repository Structure
- APT repository hosted at: https://grosman-net.github.io/orbit
- Support for amd64 and arm64 architectures
- Proper Debian repository structure: `dists/stable/main/binary-{amd64,arm64}/`
- Package pool at `pool/main/`

### Package Naming
- Package name: `orbit`
- Provides alias: `orbitctl`
- Both `apt install orbit` and `apt install orbitctl` work

### Build Scripts
- `build-apt-repo.sh` - generates APT repository with proper Release files
- `install-orbitctl.sh` - one-line installer script
- Updated `build-deb.sh` for version 1.1.0

### Documentation
- Updated README.md with APT installation as primary method
- Cleaned up temporary documentation files
- Comprehensive CHANGELOG.md entry

## 📦 Installation Methods

### 1. APT Repository (Recommended) ⭐
```bash
curl -fsSL https://grosman-net.github.io/orbit/install-orbitctl.sh | sudo bash
```

### 2. Debian Package
```bash
wget https://github.com/grosman-net/orbit/releases/download/v1.1.0/orbit_1.1.0_amd64.deb
sudo dpkg -i orbit_1.1.0_amd64.deb
```

### 3. From Source
```bash
git clone https://github.com/grosman-net/orbit.git
cd orbit
sudo ./install.sh
```

## 🗑️ Removed

- Temporary documentation files (GITHUB_AUTOMATION.sh, GO_REWRITE_SUMMARY.md, PR_DESCRIPTION.md, RELEASE_CHECKLIST.md)
- Obsolete build artifacts

## 📋 Assets

- `orbit_1.1.0_amd64.deb` - Debian package for x86_64 systems
- `orbit_1.1.0_arm64.deb` - Debian package for ARM64 systems

## 🔗 Links

- **Repository:** https://github.com/grosman-net/orbit
- **APT Repository:** https://grosman-net.github.io/orbit
- **Documentation:** [README.md](https://github.com/grosman-net/orbit/blob/main/README.md)
- **Full Changelog:** [CHANGELOG.md](https://github.com/grosman-net/orbit/blob/main/CHANGELOG.md)

## ⬆️ Upgrade from v1.0.x

If you installed via `.deb` package:
```bash
wget https://github.com/grosman-net/orbit/releases/download/v1.1.0/orbit_1.1.0_amd64.deb
sudo dpkg -i orbit_1.1.0_amd64.deb
```

Or switch to APT repository for automatic updates:
```bash
curl -fsSL https://grosman-net.github.io/orbit/install-orbitctl.sh | sudo bash
```

---

**Full Changelog:** v1.0.6...v1.1.0

