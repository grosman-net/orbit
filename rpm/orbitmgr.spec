Name: orbitmgr
Version: 1.0.0
Release: 1%{?dist}
Summary: Orbit Manager
License: MIT

Requires: nodejs, npm, avahi

%description
Orbit Manager is a simple server management panel.

%prep
%setup -q

%build
# No build steps required for Node.js applications

%install
mkdir -p %{buildroot}/opt/orbitmgr
cp -r * %{buildroot}/opt/orbitmgr

mkdir -p %{buildroot}/etc/systemd/system
cp debian/orbitmgr.service %{buildroot}/etc/systemd/system/orbitmgr.service

%post
# Install dependencies
npm install --production --prefix /opt/orbitmgr
systemctl enable orbitmgr
systemctl start orbitmgr

%files
/opt/orbitmgr
/etc/systemd/system/orbitmgr.service

%changelog
* $(date +"%a %b %d %Y") Stanislav Grosman <stanislav.grosman@example.com> - 1.0.0-1
- Initial RPM package
