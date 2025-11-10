# Orbit APT Repository

Official APT repository for **Orbit Server Management Panel**.

## 🚀 Quick Install

Run this single command to install Orbit:

```bash
curl -fsSL https://grosman-net.github.io/orbit/install-orbitctl.sh | sudo bash
```

Or manually:

```bash
# Add repository
echo "deb [trusted=yes] https://grosman-net.github.io/orbit/apt-repo stable main" | sudo tee /etc/apt/sources.list.d/orbitctl.list

# Update and install
sudo apt update
sudo apt install orbitctl
```

## 📦 Available Packages

- `orbitctl` - Orbit Server Management Panel

## 🔧 After Installation

```bash
# Configure
sudo orbit-setup

# Enable and start
sudo systemctl enable orbit
sudo systemctl start orbit

# Access at http://your-server-ip:3333
```

## 🌐 Supported Systems

- Ubuntu 20.04 LTS+
- Ubuntu 22.04 LTS+
- Ubuntu 24.04 LTS+
- Debian 11+
- Debian 12+

## 📖 Documentation

Full documentation: https://github.com/grosman-net/orbit

## 🔐 Package Signing

Currently using `[trusted=yes]` for simplicity. GPG signing coming soon.

