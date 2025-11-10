#!/bin/bash
# Orbit Release Build Script
# Builds binaries for multiple platforms

set -e

VERSION="1.0.0"
DIST_DIR="dist"

echo "Building Orbit v${VERSION} for release..."

# Clean previous builds
rm -rf ${DIST_DIR}
mkdir -p ${DIST_DIR}

# Build for Ubuntu/Debian (amd64)
echo "Building for linux/amd64..."
GOOS=linux GOARCH=amd64 go build -o ${DIST_DIR}/orbit-${VERSION}-linux-amd64 -ldflags="-s -w -X main.Version=${VERSION}" .
GOOS=linux GOARCH=amd64 go build -o ${DIST_DIR}/orbit-setup-${VERSION}-linux-amd64 -ldflags="-s -w" ./cmd/setup

# Build for Ubuntu/Debian (arm64)
echo "Building for linux/arm64..."
GOOS=linux GOARCH=arm64 go build -o ${DIST_DIR}/orbit-${VERSION}-linux-arm64 -ldflags="-s -w -X main.Version=${VERSION}" .
GOOS=linux GOARCH=arm64 go build -o ${DIST_DIR}/orbit-setup-${VERSION}-linux-arm64 -ldflags="-s -w" ./cmd/setup

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

# Create tarballs
echo "Creating release archives..."
cd ${DIST_DIR}

# amd64 tarball
tar czf orbit-${VERSION}-linux-amd64.tar.gz \
    orbit-${VERSION}-linux-amd64 \
    orbit-setup-${VERSION}-linux-amd64 \
    web/ \
    install.sh \
    uninstall.sh \
    README.md \
    LICENSE \
    CHANGELOG.md

# arm64 tarball
tar czf orbit-${VERSION}-linux-arm64.tar.gz \
    orbit-${VERSION}-linux-arm64 \
    orbit-setup-${VERSION}-linux-arm64 \
    web/ \
    install.sh \
    uninstall.sh \
    README.md \
    LICENSE \
    CHANGELOG.md

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

