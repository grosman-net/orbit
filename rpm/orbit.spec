Name:           orbit
Version:        1.2.0
Release:        1%{?dist}
Summary:        Modern server management panel for RHEL/CentOS/Rocky Linux
License:        Apache-2.0
URL:            https://github.com/grosman-net/orbit
Source0:        %{name}-%{version}.tar.gz

BuildRequires:  golang >= 1.21
BuildRequires:  systemd
Requires:       systemd

%description
Orbit is a lightweight, modern server management panel built with Go.
It provides a web-based interface for managing RHEL/CentOS/Rocky Linux servers.

Features:
- Real-time system monitoring with charts
- Package management (YUM/DNF)
- Service control (systemd)
- Network configuration with persistence
- User management
- Interactive config editor
- System logs viewer
- Secure authentication

%prep
%setup -q

%build
export GOOS=linux
export GOARCH=%{_arch}
export CGO_ENABLED=0

# Build main binary
go build -v -ldflags="-s -w -X main.Version=%{version}" -o orbit .

# Build setup utility
go build -v -ldflags="-s -w" -o orbit-setup ./cmd/setup

%install
# Install binaries
install -d %{buildroot}%{_bindir}
install -m 755 orbit %{buildroot}%{_bindir}/orbit
install -m 755 orbit-setup %{buildroot}%{_bindir}/orbit-setup

# Install systemd unit
install -d %{buildroot}%{_unitdir}
install -m 644 rpm/orbit.service %{buildroot}%{_unitdir}/orbit.service

# Install documentation
install -d %{buildroot}%{_docdir}/%{name}
install -m 644 README.md %{buildroot}%{_docdir}/%{name}/README.md
install -m 644 CHANGELOG.md %{buildroot}%{_docdir}/%{name}/CHANGELOG.md
install -m 644 LICENSE %{buildroot}%{_docdir}/%{name}/LICENSE

%pre
# Create orbit user if it doesn't exist (optional, since we run as root)
# getent passwd orbit >/dev/null 2>&1 || useradd -r -s /sbin/nologin orbit

%post
# Enable systemd service (but don't start - user needs to configure first)
systemctl daemon-reload >/dev/null 2>&1 || true

%preun
if [ $1 -eq 0 ]; then
    # Package removal, not upgrade
    systemctl stop orbit >/dev/null 2>&1 || true
    systemctl disable orbit >/dev/null 2>&1 || true
fi

%postun
if [ $1 -ge 1 ]; then
    # Package upgrade
    systemctl daemon-reload >/dev/null 2>&1 || true
fi

%files
%{_bindir}/orbit
%{_bindir}/orbit-setup
%{_unitdir}/orbit.service
%doc %{_docdir}/%{name}/README.md
%doc %{_docdir}/%{name}/CHANGELOG.md
%license %{_docdir}/%{name}/LICENSE

%changelog
* Wed Dec 03 2025 grosman-net <https://github.com/grosman-net> - 1.2.0-1
- Initial RPM package for RHEL/CentOS/Rocky Linux
- Added RPM support alongside existing DEB support
- Switched license from MIT to Apache 2.0
- Full feature parity with DEB package

