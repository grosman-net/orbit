#!/bin/bash
# Build APT Repository for Orbit

set -e

VERSION="${1:-1.0.7}"
REPO_DIR="apt-repo"
DIST="stable"

echo "Building APT repository for Orbit v${VERSION}..."

# Clean and create structure
rm -rf ${REPO_DIR}
mkdir -p ${REPO_DIR}/pool/main
mkdir -p ${REPO_DIR}/dists/${DIST}/main/binary-amd64
mkdir -p ${REPO_DIR}/dists/${DIST}/main/binary-arm64

# Copy .deb files to pool
echo "Copying packages to pool..."
cp dist/orbit_${VERSION}_amd64.deb ${REPO_DIR}/pool/main/
cp dist/orbit_${VERSION}_arm64.deb ${REPO_DIR}/pool/main/

# Generate Packages files
echo "Generating Packages files..."

cd ${REPO_DIR}

# amd64
dpkg-scanpackages --arch amd64 pool/ > dists/${DIST}/main/binary-amd64/Packages
gzip -9 -k -f dists/${DIST}/main/binary-amd64/Packages

# arm64
dpkg-scanpackages --arch arm64 pool/ > dists/${DIST}/main/binary-arm64/Packages
gzip -9 -k -f dists/${DIST}/main/binary-arm64/Packages

# Generate Release file
echo "Generating Release file..."
cat > dists/${DIST}/Release <<EOF
Origin: Orbit
Label: Orbit
Suite: stable
Codename: ${DIST}
Version: ${VERSION}
Architectures: amd64 arm64
Components: main
Description: Orbit Server Management Panel APT Repository
Date: $(date -R -u)
EOF

# Add file hashes to Release
echo "MD5Sum:" >> dists/${DIST}/Release
find dists/${DIST} -type f -name "Packages*" -exec md5sum {} \; | sed "s|dists/${DIST}/| |" >> dists/${DIST}/Release

echo "SHA256:" >> dists/${DIST}/Release
find dists/${DIST} -type f -name "Packages*" -exec sha256sum {} \; | sed "s|dists/${DIST}/| |" >> dists/${DIST}/Release

cd ..

echo ""
echo "✅ APT repository built successfully!"
echo "   Repository: ${REPO_DIR}/"
echo ""
echo "Directory structure:"
tree ${REPO_DIR} 2>/dev/null || find ${REPO_DIR} -type f

echo ""
echo "To use this repository:"
echo "  1. Host ${REPO_DIR}/ on a web server"
echo "  2. Add to sources.list:"
echo "     deb [trusted=yes] https://your-domain.com/apt-repo stable main"
echo "  3. apt update && apt install orbitctl"

