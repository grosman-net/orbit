Name: orbitmgr
Version: 1.0.0
Release: 1%{?dist}
Summary: Orbit Management Panel
License: MIT

Requires: systemd

%description
Orbit Management Panel for server monitoring and management.

%prep
%setup -q

%build

%install
mkdir -p %{buildroot}/opt/orbit
cp -r * %{buildroot}/opt/orbit

%post
# Post-installation script for RPM-based systems
useradd -r -m -s /bin/bash orbitmgr || echo "User already exists"
chown -R orbitmgr:orbitmgr /opt/orbit
chmod -R 750 /opt/orbit
systemctl enable orbitmgr.service
systemctl start orbitmgr.service

%files
/opt/orbit

%changelog
* 5 сентября 2025 г. Orbit Management Panel initial release
