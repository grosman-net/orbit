Name: orbitmgr
Version: 1.0.0
Release: 1%{?dist}
Summary: Orbit Management Panel
License: MIT

Requires: systemd

Source0: orbitmgr-1.0.0.tar.gz

%description
Orbit Management Panel for server monitoring and management.

%prep
%setup -q

%build

%install
mkdir -p %{buildroot}/opt/orbit
rsync -av --exclude=node_modules . %{buildroot}/opt/orbit

%post
# Post-installation script for RPM-based systems
useradd -r -m -s /bin/bash orbitmgr || echo "User already exists"
chown -R orbitmgr:orbitmgr /opt/orbit
chmod -R 750 /opt/orbit
systemctl enable orbitmgr.service
systemctl start orbitmgr.service

%files
%exclude /opt/orbit/node_modules

%changelog
* Mon Sep 04 2023 Orbit Team <support@orbit.local> - 1.0.0-1
- Initial release
