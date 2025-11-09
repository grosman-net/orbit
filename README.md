# Orbit 🚀

**Modern Server & Cluster Management for DevOps and Developers**

Orbit is a lightweight, intuitive, and extensible control center that makes it effortless to install, configure, and monitor software on Linux servers. Bring Heroku-like simplicity to your own infrastructure without the complexity of Kubernetes or the legacy constraints of traditional control panels.

## ✨ Why Choose Orbit?

Managing servers shouldn't require deep terminal expertise. Orbit provides:

- **Ubuntu-Ready Package Management** – Search, install, upgrade, or purge `apt` packages without leaving the UI
- **Systemd Service Control** – Start, stop, restart, enable, or disable any systemd unit in one click
- **Firewall & Networking** – Inspect interfaces, toggle UFW, and add allow/deny rules visually
- **Smart Config Builder** – Safely edit curated configuration files (Nginx, SSH, UFW) with validation hints
- **Comprehensive Monitoring** – Real-time CPU, RAM, disk, network, uptime, and process metrics from the OS
- **Secure Architecture** – Uses audited command wrappers with optional password-less sudo configuration plus admin login
- **Extensible Platform** – Modern API-first design for customization and integration

## 🏗️ Technology Stack

- **Runtime**: Next.js 15 (App Router, Node.js runtime)
- **Frontend**: React 19 + Tailwind CSS + Radix UI primitives
- **Data Layer**: Direct integrations with Ubuntu tooling (`apt`, `systemctl`, `ufw`, `journalctl`, `getent`)
- **Charts & UI**: Recharts, Lucide icons, shadcn/ui components
- **CI/CD**: GitHub Actions (build + lint on push / PR)

## 📋 Project Roadmap

### Phase 1 – Core Platform (MVP) [In Progress]
- Agent installation script (single command bootstrap)
- Package manager integration (apt, yum, pacman)
- Basic package actions (list, install, remove, upgrade)
- Service management (systemd: start/stop/restart/status)
- Web UI: authentication & secure sessions
- Server overview dashboard (CPU, RAM, Disk, Uptime)

### Phase 2 – Usability & Developer Experience
- Config Builder UI – checkbox & dropdown based configuration
- Auto-generate configs for Nginx, PostgreSQL, Redis, etc.
- User roles & permissions (admin, dev, read-only)
- Basic alerting system (CPU/RAM/Disk thresholds)
- REST + gRPC API for automation

### Phase 3 – Multi-Server & Clusters
- Multi-node management (add/remove servers in one dashboard)
- Cluster view (map of all nodes + health status)
- Bulk actions (install/remove/update across servers)
- SSH key & secrets manager
- Simple backup/restore for configs

### Phase 4 – Advanced Monitoring & Extensions
- Real-time metrics (charts for CPU, RAM, Network, Disk I/O)
- Log viewer with filtering & search
- Plugin system for adding custom modules/packages
- Integration with cloud providers (AWS, GCP, Azure, DigitalOcean)
- API tokens for CI/CD pipelines

### Phase 5 – Mobile & Enterprise Features
- Mobile app (push notifications, quick actions like restart service)
- Webhooks & integrations (Slack, Discord, PagerDuty)
- Advanced RBAC (team management, org-level permissions)
- Audit logs & compliance features
- High-availability setup for Orbit itself

## 🚀 Getting Started

### Prerequisites

- Ubuntu 20.04 or newer with `systemd`, `apt`, `ufw`, and `journalctl` available
- Node.js 20+ and pnpm 9+
- Orbit must run as root **or** the hosting user must have password-less sudo rights for the commands Orbit executes

> 💡 Configure sudo by adding an entry such as:
> ```
> orbit ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt-cache, /usr/bin/dpkg-query, /usr/bin/systemctl, /usr/sbin/ufw, /usr/bin/journalctl, /usr/bin/getent, /usr/sbin/useradd, /usr/sbin/userdel, /usr/bin/passwd, /usr/bin/tee, /usr/bin/lastlog, /usr/bin/who, /usr/bin/ip, /usr/bin/ps, /usr/bin/df, /usr/bin/uname, /usr/bin/hostname
> ```
> Adjust the username and command paths to your environment.

### Quick Installation

```bash
# Clone the repository and checkout the Ubuntu-ready branch
git clone https://github.com/orbit/orbit.git
cd orbit
git checkout ubuntu-ready

# Run the guided installer (asks for install dir, port, admin credentials)
sudo ./install-orbit.sh
```

### Basic Usage
1. Open `http://<your-ip>:<port>` (default `http://<ip>:3333`) in a browser.
2. Sign in using the admin username and password you entered during installation.
3. Monitor CPU, memory, disk, network, uptime, and processes on the **Dashboard** or **Monitoring** tabs.
4. Manage `apt` packages under **Packages**.
5. Control `systemd` services in **Services**.
6. Configure firewall and networking via **Network**.
7. Edit curated configuration files in **Configuration Editor** (Settings).
8. Review `journalctl` logs and manage server accounts in **Logs** and **Users**.

## 🛠️ Development

### Building from Source

```bash
pnpm install       # install dependencies
pnpm lint          # run TypeScript and ESLint checks
pnpm build         # create a production build
pnpm start         # start the production server
```

GitHub Actions (`.github/workflows/ci.yml`) automatically run `pnpm install`, `pnpm lint`, and `pnpm build` for pushes and pull requests targeting `ubuntu-ready`, `dev`, or `main`.

### Configuration

- The installer (`install-orbit.sh`) automatically runs `pnpm run setup` and stores the selected values in `.env.production` inside the install directory. You can rerun `pnpm run setup` (or `make setup`) later if you need to regenerate credentials.
- Key environment variables:
  - `PORT` – HTTP port exposed by the panel (defaults to 3333)
  - `NEXTAUTH_URL` – public URL used for auth callbacks
  - `NEXTAUTH_SECRET` – secret used to sign sessions
  - `ORBIT_ADMIN_USERNAME` / `ORBIT_ADMIN_PASSWORD_HASH` – administrator credentials (password stored as a bcrypt hash)
- To update settings after installation, edit `.env.production` in the install directory and restart the service (`sudo systemctl restart orbit`).

### Systemd Unit

The installer generates and enables `/etc/systemd/system/orbit.service`. For manual customization you can use the example in `scripts/systemd/orbit.service`. Common commands:

```bash
# Restart the service
sudo systemctl restart orbit

# Follow logs
sudo journalctl -u orbit -f
```

The service invokes `pnpm start`, which automatically honors the port and environment variables defined in `.env.production`.

### Uninstall

```bash
sudo ./uninstall-orbit.sh
```

The uninstaller stops and disables the systemd unit, removes the install directory, and optionally deletes the system user created during installation.

### Contributing
We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Code style and standards
- Pull request process
- Development environment setup
- Testing requirements

## 📚 Documentation

This branch focuses on the Ubuntu integration. Key API endpoints (all under `/api/*`):

- `/system/summary` – Real-time metrics: CPU, memory, disk, network, uptime, load averages, processes
- `/packages` – List installed packages, search the archives, install/purge/update/upgrade
- `/services` – Enumerate systemd units and issue `start`, `stop`, `restart`, `reload`, `enable`, `disable`
- `/network` – Inspect interfaces, toggle UFW, add allow/deny rules, reload firewall
- `/logs` – Stream `journalctl` entries with unit and priority filters
- `/users` – List, create, lock/unlock, and delete Linux accounts
- `/config` – Enumerate and edit curated configuration files (Nginx default site, sshd_config, UFW rules)

## 🤝 Community

Join our growing community:
- **GitHub Discussions**: Ask questions and share ideas
- **Discord Server**: Real-time chat with developers and users
- **Twitter**: Follow [@orbit_sh](https://twitter.com/orbit_sh) for updates
- **Blog**: Tutorials, case studies, and technical deep dives

## 📄 License

Orbit is open source software licensed under the [Apache 2.0 License](LICENSE) - free to use, modify, and distribute with patent protection.

## 🔮 Vision

We believe server management should be accessible to every developer, not just infrastructure specialists. Orbit aims to democratize server management by providing beautiful, intuitive tools that abstract away complexity while maintaining flexibility and power.

---

**Orbit** - Making server management effortless since 2025.
