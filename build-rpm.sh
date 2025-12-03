#!/bin/bash
# Orbit RPM Package Build Script

set -e

VERSION="${1:-1.2.0}"
ARCH="${2:-x86_64}"
BUILD_DIR="build-rpm"
SPEC_FILE="rpm/orbit.spec"

echo "Building Orbit v${VERSION} RPM package for ${ARCH}..."

# Check if rpmbuild is available
if ! command -v rpmbuild &> /dev/null; then
    echo "❌ rpmbuild is not installed"
    echo "   Install with: sudo yum install rpm-build rpmdevtools"
    echo "   Or: sudo dnf install rpm-build rpmdevtools"
    exit 1
fi

# Clean previous builds
rm -rf ${BUILD_DIR}
mkdir -p ${BUILD_DIR}/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}

# Create source tarball
echo "Creating source tarball..."
TARBALL_NAME="orbit-${VERSION}"
TARBALL_DIR="${BUILD_DIR}/SOURCES/${TARBALL_NAME}"
mkdir -p ${TARBALL_DIR}

# Copy source files
cp -r internal cmd web main.go go.mod go.sum Makefile README.md CHANGELOG.md LICENSE ${TARBALL_DIR}/
cp -r rpm ${TARBALL_DIR}/

# Create tarball
cd ${BUILD_DIR}/SOURCES
tar czf orbit-${VERSION}.tar.gz ${TARBALL_NAME}
cd ../..

# Copy spec file
cp ${SPEC_FILE} ${BUILD_DIR}/SPECS/

# Update spec file version
sed -i "s/^Version:.*/Version:        ${VERSION}/" ${BUILD_DIR}/SPECS/orbit.spec

# Set architecture
if [ "$ARCH" = "aarch64" ]; then
    RPM_ARCH="aarch64"
    GOARCH="arm64"
elif [ "$ARCH" = "x86_64" ]; then
    RPM_ARCH="x86_64"
    GOARCH="amd64"
else
    echo "Unsupported architecture: $ARCH"
    exit 1
fi

# Build RPM
echo "Building RPM package..."
export GOARCH=${GOARCH}
rpmbuild \
    --define "_topdir $(pwd)/${BUILD_DIR}" \
    --define "_arch ${RPM_ARCH}" \
    --define "dist .el8" \
    -ba ${BUILD_DIR}/SPECS/orbit.spec

# Find and copy built RPM
RPM_FILE=$(find ${BUILD_DIR}/RPMS -name "orbit-${VERSION}*.rpm" | head -1)
if [ -z "$RPM_FILE" ]; then
    echo "❌ RPM file not found"
    exit 1
fi

# Create dist directory and copy RPM
mkdir -p dist
cp ${RPM_FILE} dist/

RPM_NAME=$(basename ${RPM_FILE})
echo ""
echo "✅ RPM package built successfully!"
echo "   📦 dist/${RPM_NAME}"
echo ""
echo "Install with:"
echo "   sudo rpm -ivh dist/${RPM_NAME}"
echo "   # or"
echo "   sudo yum localinstall dist/${RPM_NAME}"
echo "   # or"
echo "   sudo dnf localinstall dist/${RPM_NAME}"
echo ""
echo "Package info:"
rpm -qip dist/${RPM_NAME}

