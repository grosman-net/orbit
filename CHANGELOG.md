# Changelog

All notable changes to Orbit Server Management Panel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-11-10

### Fixed
- **Critical Bug in install.sh** (Go Installation)
  - Fixed: `install_go()` function now saves and restores current directory
  - Fixed: Script was stuck in `/tmp` after Go installation
  - Fixed: `go.mod file not found` error during build
  - Added: Return to original directory after Go installation
  - Removed: Redundant `cd "$(dirname "$0")"` after `install_go()`

### Technical Details
- `install_go()` now uses `local ORIG_DIR="$(pwd)"` to save directory
- Returns to `$ORIG_DIR` after Go installation and cleanup
- Ensures build happens in the correct project directory

## [1.0.2] - 2025-11-10

### Added
- **Automatic Go Installation** in `install.sh`
  - Automatically downloads and installs Go 1.23.0 if not present
  - Automatically upgrades Go if version is older than 1.21
  - Automatically installs wget if needed
  - Zero prerequisites - fully automated installation
  - Adds Go to PATH in /etc/profile and ~/.bashrc

### Changed
- **Installation Process**: Now requires zero manual setup
  - No need to install Go manually
  - No need to download pre-built binaries
  - Single command: `sudo ./install.sh`
  
### Documentation
- Updated README.md to reflect automated installation
- Updated version badge: 1.0.0 → 1.0.2

## [1.0.1] - 2025-11-10

### Fixed
- **Release Archive Structure** (Critical)
  - Archives now extract to proper directory (`orbit-VERSION-linux-ARCH/`)
  - Fixed binary naming (normalized to `orbit` and `orbit-setup`)
  - Fixed `install.sh` to correctly locate binaries
  - All files now have correct permissions (chmod +x)
  - Updated SHA256 checksums

### Testing
- Verified archive extraction creates proper directory structure
- Verified `install.sh` works correctly with extracted files
- Tested complete installation flow from download to service start

## [1.0.0] - 2025-11-10

### Added
- **System Monitoring**
  - Real-time CPU, memory, disk, and network metrics
  - Interactive charts with Chart.js
  - Configurable refresh intervals (3s, 5s, 10s, 30s)
  - Export system metrics to TXT format
  - Load average, uptime, process count tracking

- **Package Management**
  - List installed APT packages
  - Search and install new packages
  - Remove and purge packages
  - Update package lists and upgrade all packages
  - Package name validation for security

- **Service Management**
  - List all systemd services
  - Start, stop, restart services
  - Enable/disable services at boot
  - View service status and descriptions

- **Network Configuration**
  - Interface management (up/down)
  - IP address configuration with persistence
  - Gateway configuration via netplan
  - Routing table management
  - UFW firewall control
  - Add/delete firewall rules

- **User Management**
  - List system users
  - Create new users
  - Lock/unlock accounts
  - Delete users
  - Last login information

- **Configuration File Editor**
  - RAW mode: Direct text editing
  - INTERACTIVE mode: Form-based editing with:
    - Enable/Disable toggles
    - Type-specific inputs (text, number, select)
    - Real-time validation
    - Comment management
  - Supported configs: SSH, UFW, Nginx

- **System Logs**
  - View systemd journal logs
  - Filter by service unit
  - Real-time log viewing

- **Security Features**
  - Bcrypt password hashing
  - Session-based authentication
  - HTTP-only secure cookies
  - Input validation on all endpoints
  - Shell injection protection
  - Package name validation

- **User Interface**
  - Modern dark theme with glassmorphism
  - Mint-emerald gradient accents
  - Responsive design (mobile/desktop)
  - Interactive charts and graphs
  - Smooth animations and transitions
  - RAW/INTERACTIVE mode switcher for configs

### Security
- Fixed shell injection vulnerability in netplan config generation
- Added input validation for interface names
- Added package name validation (Debian naming rules)
- Added data validation for monitoring API responses
- Implemented proper file writing instead of shell commands

### Changed
- Complete rewrite from Next.js/TypeScript to Go
- Embedded frontend in Go binary (no runtime dependencies)
- Simplified deployment (single binary + systemd)
- Improved network interface parsing logic
- Enhanced UI with better dark theme
- Better error handling throughout

### Documentation
- Complete README.md rewrite
- Added installation instructions
- Added usage guide
- Added troubleshooting section
- Added MIT License
- Added CHANGELOG

### Platform Support
- Ubuntu 20.04 LTS and newer
- Debian 11 and newer
- Architecture: amd64, arm64

## [Unreleased]

### Planned Features
- RHEL/CentOS/Rocky Linux support
- Docker container management
- Backup and restore functionality
- Two-factor authentication
- API token authentication
- WebSocket for real-time updates
- Multi-user support with roles
- Nginx virtual host editor
- SSL certificate management
- Cron job management
- File manager

---

[1.0.0]: https://github.com/grosman-net/orbit/releases/tag/v1.0.0

