#!/bin/bash
# Orbit Debian Package Build Script

set -e

VERSION="${1:-1.0.5}"
ARCH="${2:-amd64}"
BUILD_DIR="build-deb"

echo "Building Orbit v${VERSION} .deb package for ${ARCH}..."

# Clean previous builds
rm -rf ${BUILD_DIR}
mkdir -p ${BUILD_DIR}

# Create package structure
PKG_DIR="${BUILD_DIR}/orbit_${VERSION}_${ARCH}"
mkdir -p ${PKG_DIR}/DEBIAN
mkdir -p ${PKG_DIR}/usr/local/bin
mkdir -p ${PKG_DIR}/lib/systemd/system
mkdir -p ${PKG_DIR}/usr/share/doc/orbit

# Build binaries for target architecture
echo "Building binaries for ${ARCH}..."
if [ "$ARCH" = "amd64" ]; then
    GOARCH=amd64 go build -o ${PKG_DIR}/usr/local/bin/orbit -ldflags="-s -w -X main.Version=${VERSION}" .
    GOARCH=amd64 go build -o ${PKG_DIR}/usr/local/bin/orbit-setup -ldflags="-s -w" ./cmd/setup
elif [ "$ARCH" = "arm64" ]; then
    GOARCH=arm64 go build -o ${PKG_DIR}/usr/local/bin/orbit -ldflags="-s -w -X main.Version=${VERSION}" .
    GOARCH=arm64 go build -o ${PKG_DIR}/usr/local/bin/orbit-setup -ldflags="-s -w" ./cmd/setup
else
    echo "Unsupported architecture: $ARCH"
    exit 1
fi

chmod 755 ${PKG_DIR}/usr/local/bin/orbit
chmod 755 ${PKG_DIR}/usr/local/bin/orbit-setup

# Copy package metadata and scripts
echo "Copying package files..."
cp -r debian/DEBIAN/* ${PKG_DIR}/DEBIAN/

# Update version in control file
sed -i "s/^Version:.*/Version: ${VERSION}/" ${PKG_DIR}/DEBIAN/control
sed -i "s/^Architecture:.*/Architecture: ${ARCH}/" ${PKG_DIR}/DEBIAN/control

# Calculate installed size (in KB)
INSTALLED_SIZE=$(du -sk ${PKG_DIR}/usr | cut -f1)
# Remove any existing Installed-Size line and add new one
sed -i '/^Installed-Size:/d' ${PKG_DIR}/DEBIAN/control
echo "Installed-Size: ${INSTALLED_SIZE}" >> ${PKG_DIR}/DEBIAN/control

# Copy systemd unit
cp debian/lib/systemd/system/orbit.service ${PKG_DIR}/lib/systemd/system/

# Copy documentation
cp debian/usr/share/doc/orbit/copyright ${PKG_DIR}/usr/share/doc/orbit/
cp CHANGELOG.md ${PKG_DIR}/usr/share/doc/orbit/changelog
gzip -9 -n ${PKG_DIR}/usr/share/doc/orbit/changelog

# Copy README
cp README.md ${PKG_DIR}/usr/share/doc/orbit/README.md

# Set correct permissions
echo "Setting permissions..."
find ${PKG_DIR} -type d -exec chmod 755 {} \;
find ${PKG_DIR}/usr/local/bin -type f -exec chmod 755 {} \;
chmod 644 ${PKG_DIR}/lib/systemd/system/orbit.service
chmod 644 ${PKG_DIR}/usr/share/doc/orbit/*

# Build the package
echo "Building .deb package..."
dpkg-deb --build --root-owner-group ${PKG_DIR}

# Move to dist directory
mkdir -p dist
mv ${BUILD_DIR}/orbit_${VERSION}_${ARCH}.deb dist/

echo ""
echo "✅ Package built successfully!"
echo "   📦 dist/orbit_${VERSION}_${ARCH}.deb"
echo ""
echo "Install with:"
echo "   sudo dpkg -i dist/orbit_${VERSION}_${ARCH}.deb"
echo "   sudo apt-get install -f  # if there are dependency issues"
echo ""
echo "Package info:"
dpkg-deb --info dist/orbit_${VERSION}_${ARCH}.deb

