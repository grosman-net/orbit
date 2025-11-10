# Orbit v1.0.0 - First Stable Release 🎉

**Release Date**: November 10, 2025  
**Platform**: Ubuntu 20.04+ / Debian 11+  
**Architecture**: amd64, arm64

---

## 🌟 Highlights

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

---

## 📦 Installation

### Quick Install

```bash
# Download
wget https://github.com/grosman-net/orbit/releases/download/v1.0.0/orbit-1.0.0-linux-amd64.tar.gz

# Extract
tar xzf orbit-1.0.0-linux-amd64.tar.gz
cd orbit-1.0.0-linux-amd64

# Install
sudo ./install.sh
```

### From Source

```bash
git clone https://github.com/grosman-net/orbit.git
cd orbit
git checkout v1.0.0
sudo ./install.sh
```

---

## 🔒 Security

This release includes important security improvements:

- ✅ **Fixed shell injection vulnerability** in netplan config generation
- ✅ **Added input validation** for interface names and package names
- ✅ **Implemented proper file writing** instead of shell commands
- ✅ **Added data validation** for all API responses

---

## 🐛 Known Issues

- Interactive config editor only supports SSH, UFW, and Nginx (more coming soon)
- Netplan apply may take a few seconds for network changes
- No WebSocket support yet (uses polling for real-time updates)

---

## 📋 Requirements

### System
- Ubuntu 20.04 LTS or newer
- Debian 11 or newer
- 512 MB RAM minimum (1 GB recommended)
- 50 MB disk space

### Runtime
- Go 1.21+ (for building from source)
- systemd
- APT package manager
- netplan (for persistent network config)

---

## 🚀 What's Next?

### Planned for v1.1.0
- RHEL/CentOS/Rocky Linux support
- Docker container management
- Two-factor authentication
- WebSocket for real-time updates

### Future Roadmap
- Backup and restore functionality
- Multi-user support with roles
- Nginx virtual host editor
- SSL certificate management
- Cron job management
- File manager

---

## 📝 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete list of changes.

---

## 🤝 Contributing

Contributions are welcome! Please see [README.md](README.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

**Author**: grosman-net

---

## 📥 Download

**Linux amd64** (Intel/AMD 64-bit):
```
orbit-1.0.0-linux-amd64.tar.gz
SHA256: b143efcebc2d7b87ca9b1c4f31d11e9fa2f38531fc01fa95e8dc9f0eb34cf851
```

**Linux arm64** (ARM 64-bit, e.g., Raspberry Pi 4):
```
orbit-1.0.0-linux-arm64.tar.gz
SHA256: 5aa3c06b100daec70508e7fda1e4a7372fbb29ef33b01c4952a86c978b1c5bc0
```

---

## 🙏 Thank You

Thank you to everyone who tested and provided feedback during development!

**Made with ❤️ for system administrators**

