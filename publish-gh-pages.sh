#!/bin/bash
# Publish APT repository and installer to the gh-pages branch.
set -e

VERSION="${1:-1.2.1}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
TMP="${ROOT}/.gh-pages-publish"

cd "$ROOT"
./build-release.sh "$VERSION"
./build-apt-repo.sh "$VERSION"

rm -rf "$TMP"
/usr/bin/git clone --depth 1 --branch gh-pages git@github.com:grosman-net/orbit.git "$TMP"
cd "$TMP"

for item in *; do
  [ "$item" = "index.html" ] && continue
  rm -rf "$item"
done

cp -a "${ROOT}/apt-repo/dists" "${ROOT}/apt-repo/pool" .
cp "${ROOT}/install-orbitctl.sh" .

/usr/bin/git add -A
if /usr/bin/git diff --staged --quiet; then
  echo "gh-pages: no changes to publish"
else
  /usr/bin/git commit -m "Publish APT repository v${VERSION}"
  /usr/bin/git push origin gh-pages
  echo "Published gh-pages for v${VERSION}"
fi

cd "$ROOT"
rm -rf "$TMP"
