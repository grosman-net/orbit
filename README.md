# 🛰️ Orbit - Server Management Panel

**Orbit** is a lightweight, modern web-based server management panel for Ubuntu/Debian systems. Built with Go and vanilla JavaScript, it provides a clean interface for managing your server without the bloat.

![Version](https://img.shields.io/badge/version-1.0.5-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)
![Platform](https://img.shields.io/badge/platform-Ubuntu%20%7C%20Debian-orange)

---

## ✨ Features

### 📊 System Monitoring
- Real-time CPU, memory, disk, and network metrics
- Interactive charts with Chart.js
- Configurable refresh intervals (3s, 5s, 10s, 30s)
- Export system metrics to human-readable TXT format
- Load average, uptime, process count

### 📦 Package Management
- List installed packages (APT)
- Search and install new packages
- Remove or purge packages
- Update package lists and upgrade all packages
- Package name validation for security

### ⚙️ Service Management
- List all systemd services
- Start, stop, restart services
- Enable/disable services at boot
- View service status and descriptions

### 🌐 Network & Firewall
- **Interface Management**: View and control network interfaces (up/down)
- **IP Configuration**: Set IP addresses with subnet masks
- **Gateway Configuration**: Configure gateways with persistent netplan support
- **Routing Table**: View, add, and delete routes
- **UFW Firewall**: Enable/disable firewall, manage rules
- **Real-time Updates**: All changes reflected immediately

### 👥 User Management
- List system users
- Create new users
- Lock/unlock user accounts
- Delete users
- View last login information

### 📝 Configuration File Editor
- **RAW Mode**: Direct text editing of config files
- **INTERACTIVE Mode**: Visual form-based editing with:
  - Enable/Disable toggles for each option
  - Type-specific inputs (text, number, select)
  - Real-time validation
  - Comment management (#)
- **Supported Configs**:
  - SSH (`/etc/ssh/sshd_config`)
  - UFW (`/etc/default/ufw`)
  - Nginx (`/etc/nginx/nginx.conf`)

### 📋 System Logs
- View systemd journal logs
- Filter by service unit
- Real-time log viewing

### 🔐 Security
- **Bcrypt password hashing**
- **Session-based authentication** with HTTP-only cookies
- **Input validation** on all user inputs
- **Shell injection protection**
- **Package name validation**
- **Netplan config validation**

---

## 🚀 Quick Start

### Installation

#### Option 1: Using .deb Package (Recommended)

```bash
# Download the latest release
wget https://github.com/grosman-net/orbit/releases/download/v1.0.5/orbit_1.0.5_amd64.deb

# Install
sudo dpkg -i orbit_1.0.5_amd64.deb

# Configure
sudo orbit-setup

# Enable and start
sudo systemctl enable orbit
sudo systemctl start orbit
```

#### Option 2: From Source

```bash
# Clone the repository
git clone https://github.com/grosman-net/orbit.git
cd orbit

# Run installation script (fully automated)
sudo ./install.sh
```

The installer will **automatically**:
1. ✅ Install Go 1.23.0 if not present (or upgrade if too old)
2. ✅ Install wget if needed
3. ✅ Build the project from source
4. ✅ Run interactive setup (port, admin credentials)
5. ✅ Create and start systemd service

**No prerequisites required** - the script handles everything!

### Manual Setup

```bash
# Build from source
make build

# Run setup wizard
sudo ./orbit-setup

# Start the service
sudo systemctl start orbit
sudo systemctl enable orbit
```

### Access

Open your browser and navigate to:
```
http://your-server-ip:3333
```

Default credentials are set during installation.

### Uninstall

#### If installed via .deb package:

```bash
# Remove package (keeps configuration)
sudo dpkg -r orbit

# Or completely remove including configuration
sudo dpkg -P orbit
```

#### If installed from source:

```bash
cd /path/to/orbit
sudo ./uninstall.sh
```

---

## 📖 Usage

### Monitoring
- View real-time system metrics
- Change refresh interval
- Export metrics data

### Package Management
- Search for packages in the toolbar
- Click "Install Package" to add new software
- Use "Remove" or "Purge" buttons for installed packages
- "Update Lists" to refresh APT cache
- "Upgrade All" to upgrade all packages

### Services
- Browse all systemd services
- Use Start/Stop/Restart buttons to control services
- Services update automatically after actions

### Network
#### Interfaces
- Each interface displays as a separate card
- Use "Up"/"Down" buttons to change interface state
- **Apply**: Set IP temporarily (until reboot)
- **Apply & Save**: Set IP and save to netplan (persists after reboot)

#### Firewall
- Enable/Disable UFW firewall
- Add rules by port and protocol
- Delete existing rules

#### Routing
- View current routing table
- Add new routes (destination, gateway, interface)
- Delete routes

### Configuration Files
1. Select a config file from the sidebar
2. **RAW Mode**: Edit configuration as plain text
3. **INTERACTIVE Mode** (when available):
   - Toggle options on/off (adds/removes `#`)
   - Change values in type-appropriate fields
   - See real-time status (Enabled/Disabled)
4. Click "Save Changes"

### Users
- View all system users
- Create new users with username and password
- Lock/Unlock accounts
- Delete users (with confirmation)

### Logs
- Enter service unit name (e.g., `nginx`, `ssh`)
- Click "Load Logs" to view recent entries
- Logs display in monospace for readability

---

## 🛠️ Configuration

### Config File
Location: `/orbit/config.json` or `/etc/orbit/config.json`

```json
{
  "port": 3333,
  "adminUsername": "admin",
  "adminPasswordHash": "$2a$12$...",
  "sessionSecret": "random-secret",
  "publicURL": "http://your-server:3333"
}
```

### Changing Port
```bash
sudo systemctl stop orbit
sudo ./orbit-setup
# Enter new port
sudo systemctl start orbit
```

### Resetting Admin Password
```bash
sudo systemctl stop orbit
sudo ./orbit-setup
# Choose new password
sudo systemctl start orbit
```

---

## 🏗️ Architecture

### Backend (Go)
- **Router**: `gorilla/mux`
- **Sessions**: `gorilla/sessions` with secure cookies
- **Password Hashing**: `bcrypt`
- **Embedded Frontend**: Go `embed.FS`
- **System Commands**: `os/exec` with validation

### Frontend
- **Vanilla JavaScript** (no framework dependencies)
- **Chart.js** for real-time graphs
- **Pure CSS** with dark theme and glassmorphism
- **Responsive design** for mobile and desktop

### Directory Structure
```
orbit/
├── cmd/
│   └── setup/          # Interactive setup utility
├── internal/
│   ├── api/            # HTTP handlers
│   ├── auth/           # Authentication logic
│   ├── config/         # Configuration management
│   ├── configfiles/    # Config file editing (RAW + Interactive)
│   ├── network/        # Network management
│   ├── packages/       # Package management
│   ├── services/       # Systemd services
│   ├── system/         # System metrics
│   ├── users/          # User management
│   └── util/           # Utility functions
├── web/                # Frontend assets (embedded)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── favicon.svg
├── main.go             # Entry point
├── Makefile
├── install.sh
├── uninstall.sh
└── README.md
```

---

## 🔧 Development

### Prerequisites
- Go 1.21 or higher
- Ubuntu/Debian system
- `make`

### Build
```bash
make build
```

### Run Locally
```bash
sudo ./orbit --config config.json --port 3333
```

### Clean Build
```bash
make clean
make build
```

---

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check logs
sudo journalctl -u orbit -n 50

# Verify config
cat /orbit/config.json

# Check port availability
sudo ss -tuln | grep 3333
```

### Permission Denied
Orbit requires root privileges for system management. Run with `sudo` or via systemd service.

### Can't Login
```bash
# Reset credentials
sudo systemctl stop orbit
sudo ./orbit-setup
sudo systemctl start orbit
```

### Network Changes Don't Persist
Ensure netplan is installed:
```bash
sudo apt install netplan.io
```

---

## 📝 Uninstallation

```bash
cd /orbit
sudo ./uninstall.sh
```

This will:
- Stop and disable the service
- Remove binaries
- Remove configuration files
- Clean up systemd service

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Author**: grosman-net

---

## 🙏 Acknowledgments

- Built with [Go](https://golang.org/)
- Uses [Chart.js](https://www.chartjs.org/) for graphs
- Inspired by modern server management tools
- Dark theme with glassmorphism design

---

## 📞 Support

- **Issues**: https://github.com/grosman-net/orbit/issues
- **Documentation**: https://github.com/grosman-net/orbit/wiki

---

**Made with ❤️ for system administrators**
