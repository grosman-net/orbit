#!/bin/bash
# Orbit Release Build Script
# Builds binaries for multiple platforms

set -e

VERSION="1.0.3"
DIST_DIR="dist"

echo "Building Orbit v${VERSION} for release..."

# Clean previous builds
rm -rf ${DIST_DIR}
mkdir -p ${DIST_DIR}

# Build for Ubuntu/Debian (amd64)
echo "Building for linux/amd64..."
GOOS=linux GOARCH=amd64 go build -o ${DIST_DIR}/orbit-amd64 -ldflags="-s -w -X main.Version=${VERSION}" .
GOOS=linux GOARCH=amd64 go build -o ${DIST_DIR}/orbit-setup-amd64 -ldflags="-s -w" ./cmd/setup

# Build for Ubuntu/Debian (arm64)
echo "Building for linux/arm64..."
GOOS=linux GOARCH=arm64 go build -o ${DIST_DIR}/orbit-arm64 -ldflags="-s -w -X main.Version=${VERSION}" .
GOOS=linux GOARCH=arm64 go build -o ${DIST_DIR}/orbit-setup-arm64 -ldflags="-s -w" ./cmd/setup

# Copy web assets
echo "Copying web assets..."
mkdir -p ${DIST_DIR}/web
cp -r web/* ${DIST_DIR}/web/

# Copy scripts
echo "Copying installation scripts..."
cp install.sh ${DIST_DIR}/
cp uninstall.sh ${DIST_DIR}/
cp README.md ${DIST_DIR}/
cp LICENSE ${DIST_DIR}/
cp CHANGELOG.md ${DIST_DIR}/

# Create tarballs with proper directory structure
echo "Creating release archives..."
cd ${DIST_DIR}

# Create directory for amd64
mkdir -p orbit-${VERSION}-linux-amd64
cp orbit-amd64 orbit-${VERSION}-linux-amd64/orbit
cp orbit-setup-amd64 orbit-${VERSION}-linux-amd64/orbit-setup
cp -r web orbit-${VERSION}-linux-amd64/
cp install.sh uninstall.sh README.md LICENSE CHANGELOG.md orbit-${VERSION}-linux-amd64/
chmod +x orbit-${VERSION}-linux-amd64/orbit
chmod +x orbit-${VERSION}-linux-amd64/orbit-setup
chmod +x orbit-${VERSION}-linux-amd64/install.sh
chmod +x orbit-${VERSION}-linux-amd64/uninstall.sh

# Create amd64 tarball
tar czf orbit-${VERSION}-linux-amd64.tar.gz orbit-${VERSION}-linux-amd64/
rm -rf orbit-${VERSION}-linux-amd64

# Create directory for arm64
mkdir -p orbit-${VERSION}-linux-arm64
cp orbit-arm64 orbit-${VERSION}-linux-arm64/orbit
cp orbit-setup-arm64 orbit-${VERSION}-linux-arm64/orbit-setup
cp -r web orbit-${VERSION}-linux-arm64/
cp install.sh uninstall.sh README.md LICENSE CHANGELOG.md orbit-${VERSION}-linux-arm64/
chmod +x orbit-${VERSION}-linux-arm64/orbit
chmod +x orbit-${VERSION}-linux-arm64/orbit-setup
chmod +x orbit-${VERSION}-linux-arm64/install.sh
chmod +x orbit-${VERSION}-linux-arm64/uninstall.sh

# Create arm64 tarball
tar czf orbit-${VERSION}-linux-arm64.tar.gz orbit-${VERSION}-linux-arm64/
rm -rf orbit-${VERSION}-linux-arm64

cd ..

echo "Build complete!"
echo "Release artifacts:"
ls -lh ${DIST_DIR}/*.tar.gz

# Generate checksums
echo "Generating checksums..."
cd ${DIST_DIR}
sha256sum *.tar.gz > SHA256SUMS
cd ..

echo ""
echo "SHA256 Checksums:"
cat ${DIST_DIR}/SHA256SUMS

