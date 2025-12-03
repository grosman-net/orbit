# Changelog

All notable changes to Orbit Server Management Panel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-03

### Added 🎉

**1. RHEL/CentOS/Rocky Linux Support**
- **New Platform**: Full support for RHEL-based distributions (RHEL 8+, CentOS 8+, Rocky Linux 8+, AlmaLinux 8+)
- **RPM Packages**: Native RPM package support alongside existing DEB packages
- **Build Script**: New `build-rpm.sh` script for building RPM packages
- **Spec File**: Complete `rpm/orbit.spec` with proper systemd integration
- **Architecture Support**: Both x86_64 (amd64) and aarch64 (arm64) architectures

**2. License Change**
- **New License**: Switched from MIT License to Apache License 2.0
- **Benefits**: Better patent protection, clearer contribution guidelines
- **Updated Files**: LICENSE, all copyright notices, package metadata

### Changed 🔄

**1. Platform Support Expanded**
- Updated documentation to reflect multi-platform support
- Installation instructions now include both DEB and RPM methods
- Platform badges updated to show RHEL/CentOS/Rocky support

**2. Package Management**
- DEB packages now support Ubuntu/Debian
- RPM packages support RHEL/CentOS/Rocky Linux
- Both package formats provide identical functionality

### Technical Details
- Created `rpm/orbit.spec` for RPM package building
- Created `rpm/orbit.service` systemd unit file for RHEL systems
- Updated `build-apt-repo.sh` default version to 1.2.0
- Updated all license references from MIT to Apache 2.0
- Updated version references throughout codebase

### Files Added
- `rpm/orbit.spec` - RPM package specification
- `rpm/orbit.service` - Systemd unit for RHEL systems
- `build-rpm.sh` - RPM package build script

### Files Modified
- `LICENSE` - Changed to Apache 2.0
- `README.md` - Updated platform support, license, installation methods
- `debian/DEBIAN/control` - Updated version and description
- `debian/usr/share/doc/orbit/copyright` - Updated to Apache 2.0
- `CHANGELOG.md` - Added 1.2.0 release notes

---

## [1.1.3] - 2025-12-03

### Security & Reliability Fixes 🔒

**1. Secure Session Cookies Based on Public URL**
- **Issue:** Session cookies were always created with `Secure=false`, even when Orbit was served over HTTPS
- **Impact:** In HTTPS deployments, cookies could potentially be sent over plain HTTP if misconfigured
- **Fix:** `auth.Init()` now parses `PublicURL` and automatically sets `Secure=true` for HTTPS URLs

**2. Stronger Randomness for Session Secrets**
- **Issue:** `GenerateRandomString()` ignored errors from `crypto/rand.Read`
- **Impact:** In the (rare) case of RNG failure, secrets could be generated with lower entropy without any warning
- **Fix:** Function now fails fast (panic) if secure randomness cannot be obtained, instead of silently degrading

**3. Config Save Robustness on Read-Only Systems**
- **Issue:** Saving configs created temporary files directly under `/etc`, failing immediately on read‑only filesystems
- **Impact:** Users saw errors like `open /etc/ssh/sshd_config.tmp: read-only file system` ([#6](https://github.com/grosman-net/orbit/issues/6))
- **Fix:** Temporary files are now written under `/tmp` and then moved into place via `sudo mv`, with clearer error messages on permission/FS issues

**4. Safer User Deletion Feedback**
- **Issue:** Deleting a logged‑in user resulted in a generic `exit status 8` error ([#7](https://github.com/grosman-net/orbit/issues/7))
- **Impact:** Confusing UX and unclear reason why deletion failed
- **Fix:** `users.Delete()` now inspects `userdel` output and returns a clear, user‑friendly error when the user is currently logged in

### Technical Details
- Updated `internal/auth/auth.go` to derive cookie `Secure` flag from `PublicURL`
- Hardened `internal/util/util.go::GenerateRandomString()` to handle RNG failures explicitly
- Changed `internal/configfiles/configfiles.go::Write()` to use `/tmp` for temp files and improved error reporting
- Improved `internal/users/users.go::Delete()` error messages for logged‑in users

---

## [1.1.2] - 2025-11-11

### Bug Fixes 🐛

**1. handleLogs() - Missing Unit Parameter Validation**
- **Issue:** No validation that `unit` parameter is provided
- **Impact:** Could cause errors when querying logs without unit
- **Fix:** Added required parameter check, returns 400 Bad Request if missing

**2. handleLogs() - Lines Parameter Validation**
- **Issue:** No validation for negative or excessive line counts
- **Impact:** Could request negative lines or DoS with huge numbers
- **Fix:** Added range validation (1-10000 lines)

**3. Session Cookie Issue on Reinstall**
- **Issue:** After reinstalling Orbit, old cookies cause auth errors
- **Impact:** Users had to manually clear cookies to login
- **Fix:** Gracefully handle invalid sessions due to secret change, auto-create new session

**4. isUserLocked() - Missing Username Validation**
- **Issue:** No validation before running `passwd -S` command
- **Impact:** Could attempt to check invalid usernames
- **Fix:** Added username validation before checking lock status

### Technical Details
- Enhanced error handling in logs API endpoint
- Improved session management on config changes
- Added input validation in user lock status check
- Better user experience on reinstall (no manual cookie clearing needed)

---

## [1.1.1] - 2025-11-11

### Security Fixes 🔒

#### CRITICAL Command Injection Vulnerabilities (HIGH)
- **Network/Firewall Operations** - Fixed command injection in:
  - `AllowPort()`, `DenyPort()`, `DeleteRule()` - Firewall management
  - `SetInterfaceUp/Down()` - Interface control
  - `AddIPAddress()`, `DeleteIPAddress()` - IP configuration
  - `AddRoute()`, `DeleteRoute()` - Routing table
  - `SaveInterfaceConfig()`, `DeleteInterfaceConfig()` - Persistent config
  - Added comprehensive input validation (ports, protocols, interfaces, IPs)

- **Service Operations** - Fixed command injection in:
  - `Start()`, `Stop()`, `Restart()` - Service control
  - `Enable()`, `Disable()` - Service autostart
  - `GetStatus()`, `GetLogs()` - Service status
  - Added `isValidUnitName()` validation for systemd units

- **User Management** - Fixed command injection in:
  - `Create()`, `Delete()` - User management
  - `Lock()`, `Unlock()` - Account control
  - `ChangePassword()` - Password management
  - Added `isValidUsername()` validation (Linux username conventions)

#### MEDIUM Security Issues
- **Rate Limiting** - Added IP-based login rate limiting:
  - Maximum 5 failed attempts per IP address
  - 15-minute lockout period after limit exceeded
  - Automatic cleanup of old attempts
  - Support for reverse proxy headers (X-Forwarded-For, X-Real-IP)
  - New file: `internal/auth/ratelimit.go`

#### LOW Security Issues
- **Session Secret** - Enhanced session security:
  - Enforced minimum 32-byte session secret
  - Automatic padding if misconfigured
  - Already using crypto/rand for generation (64 chars)

### Bug Fixes 🐛

1. **services.GetLogs()** - Fixed incorrect int to string conversion
   - Was: `string(rune(lines))` ❌
   - Now: `fmt.Sprintf("%d", lines)` ✅
   - Impact: Service logs now show correct number of lines

2. **users.Create()** - Fixed password not being set
   - Password now properly piped to `chpasswd` via stdin
   - Users can now actually log in with set password
   - Impact: Created users are now usable immediately

3. **handlePackagesUpdate()** - Fixed missing error handling
   - Now properly checks JSON decode errors
   - Returns 400 Bad Request on malformed input
   - Impact: Better error messages for API consumers

### Technical Details

- Added validation functions in `network.go`:
  - `isValidInterfaceName()`, `isValidPort()`, `isValidProtocol()`
  - `isValidRuleNumber()`, `isValidIPAddress()`, `isValidIP()`
- Added `isValidUnitName()` in `services.go`
- Added `isValidUsername()` in `users.go`
- All shell command inputs now validated before execution
- No shell metacharacters allowed in any user inputs

### Security Audit Summary

| Category | Found | Fixed |
|----------|-------|-------|
| Critical Vulnerabilities | 3 | 3 ✅ |
| Medium Vulnerabilities | 1 | 1 ✅ |
| Low Vulnerabilities | 1 | 1 ✅ |
| Bugs | 3 | 3 ✅ |
| **Total Issues** | **8** | **8 ✅** |

See `SECURITY_FIXES_v1.1.1.md` for detailed security audit report.

## [1.1.0] - 2025-11-10

### Added
- **APT Repository Support**
  - Full APT repository hosted on GitHub Pages
  - One-line installation: `curl -fsSL https://grosman-net.github.io/orbit/install-orbitctl.sh | sudo bash`
  - Install via `apt install orbitctl` (package name: `orbit`, provides: `orbitctl`)
  - Automatic updates via `apt upgrade`
  - Support for amd64 and arm64 architectures

- **Interactive Package Installation**
  - `postinst` script automatically runs `orbit-setup` on first install
  - Prompts for HTTP port (default: 3333)
  - Prompts for admin username (default: admin)
  - Automatically enables and starts systemd service
  - Shows access URL and credentials after installation

- **Repository Infrastructure**
  - `build-apt-repo.sh` - generates APT repository structure
  - `install-orbitctl.sh` - one-line installer script
  - Proper `Release` file with MD5Sum and SHA256 checksums
  - GitHub Pages deployment at https://grosman-net.github.io/orbit

### Fixed
- **APT Repository Format**
  - Fixed `Release` file format to include file sizes (required by APT)
  - Proper format: `<hash> <size> <path>` for MD5Sum/SHA256 entries
  - Resolved "Unable to parse package file" error
  - Fixed "Conflicting distribution" warning

### Changed
- **Package Naming**
  - Main package name: `orbit`
  - Provides alias: `orbitctl` (both work with apt install)
  - Simplified installation and discovery

- **Documentation**
  - Updated README.md with APT installation instructions
  - Cleaned up temporary documentation files
  - Updated installation methods to prioritize APT

### Technical Details
- APT repository structure: `dists/stable/main/binary-{amd64,arm64}/`
- Package pool: `pool/main/`
- Debian control file includes `Provides: orbitctl`
- GitHub Actions workflow for automated builds
- Release file includes proper checksums with file sizes

### Removed
- Temporary documentation files (GITHUB_AUTOMATION.sh, GO_REWRITE_SUMMARY.md, etc.)
- Obsolete build artifacts

## [1.0.6] - 2025-11-10

### Added
- **Debian Package Support** (.deb)
  - Complete Debian package structure with maintainer scripts
  - `build-deb.sh` script for building .deb packages (amd64, arm64)
  - Package includes systemd unit, binaries, and documentation
  - Automatic setup via `orbit-setup` after installation
  - Config preservation on `dpkg -r`, cleanup on `dpkg -P`

### Changed
- **Installation Methods**
  - Added .deb package installation (recommended method)
  - Updated `build-release.sh` to include .deb packages
  - Updated README.md with .deb installation instructions
  - Version badge updated to 1.0.6

### Files Added
- `debian/DEBIAN/control` - package metadata
- `debian/DEBIAN/postinst` - post-installation script
- `debian/DEBIAN/prerm` - pre-removal script  
- `debian/DEBIAN/postrm` - post-removal script
- `debian/lib/systemd/system/orbit.service` - systemd unit
- `build-deb.sh` - .deb build script

### Package Details
- Size: amd64 ~2.3M, arm64 ~2.0M
- Install: `sudo dpkg -i orbit_1.0.6_amd64.deb`
- Remove: `sudo dpkg -r orbit` (keeps config)
- Purge: `sudo dpkg -P orbit` (removes config)

## [1.0.5] - 2025-11-10

### Fixed
- **Installation Error on Upgrade** ("Text file busy")
  - `install.sh` now stops running `orbit` service before replacing binaries
  - Prevents `cp: cannot create regular file: Text file busy` error
  - Service automatically restarts after installation completes
  - Fixes upgrade path for systems with orbit already running

### Technical Details
- Added systemctl check before binary installation
- Added `systemctl stop orbit` before copying binaries
- Service restarts via `systemctl restart orbit` at end of installation
- Safe for both fresh installs and upgrades

## [1.0.4] - 2025-11-10

### Added
- **First Login Password Change** (Security Enhancement)
  - Added `first_login` flag to `Config` struct in `config.json`
  - Added `GET /api/auth/first-login` - Check first login status
  - Added `POST /api/auth/change-password` - Change user password
  - Added password change modal UI with validation
  - Automatic password = username on first setup (e.g., `admin:admin`)
  - Mandatory password change on first login (cannot be skipped)
  - Clear instructions for users (Grafana-style flow)

### Fixed
- **Bug #1** (main.go): Port flag now defaults to 0, only overrides config if explicitly set (> 0)
- **Bug #2** (main.go): Removed Default() config fallback; now exits with error if config.json missing
- **Bug #3** (util.go): Fixed GenerateRandomString entropy - was generating half the requested randomness
- **Bug #4** (install.sh): Removed hardcoded `--port 3333` from systemd unit ExecStart
- **Bug #5** (cmd/setup): Removed TrimSpace from password input to prevent whitespace mismatch issues

### Changed
- **Setup Process**: Password now defaults to username
  - `orbit-setup` no longer prompts for password
  - Default credentials: `username:username` (e.g., `admin:admin`)
  - Users must change password on first web login
- **Installation Output**: Enhanced final message with clear credential display

### Security
- ✅ Removed hardcoded IP addresses from documentation (GO_REWRITE_SUMMARY.md)
- ✅ Verified `config.json` is properly gitignored
- ✅ Added `.gitignore` entry for config files

### Files Modified
- `internal/config/config.go` - Added FirstLogin field and Save() function
- `internal/api/password.go` - New file with password change handlers
- `internal/api/handler.go` - Registered new password change routes
- `cmd/setup/main.go` - Simplified setup (password = username, auto IP detection)
- `main.go` - Fixed port override logic and config loading
- `internal/util/util.go` - Fixed random string generation
- `install.sh` - Fixed systemd unit port configuration, improved output
- `web/index.html` - Added password change modal
- `web/style.css` - Added modal styling
- `web/app.js` - Added password change logic and first login check
- `GO_REWRITE_SUMMARY.md` - Removed hardcoded IP addresses

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
- ✅ ~~RHEL/CentOS/Rocky Linux support~~ (Completed in v1.2.0)
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

