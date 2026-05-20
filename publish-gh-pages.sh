#!/bin/bash
# Publish APT repository and installer to the gh-pages branch.
set -e

VERSION="${1:-1.2.1}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
WORKTREE="${ROOT}/.gh-pages-worktree"

cd "$ROOT"
./build-release.sh "$VERSION"
./build-apt-repo.sh "$VERSION"

rm -rf "$WORKTREE"
git fetch origin gh-pages
git worktree add -B gh-pages "$WORKTREE" origin/gh-pages

# Keep landing page, replace repo metadata
find "$WORKTREE" -mindepth 1 -maxdepth 1 ! -name 'index.html' -exec rm -rf {} +
cp -a apt-repo/dists apt-repo/pool "$WORKTREE/"
cp install-orbitctl.sh "$WORKTREE/"

cd "$WORKTREE"
git add -A
if git diff --staged --quiet; then
  echo "gh-pages: no changes to publish"
else
  git commit -m "Publish APT repository v${VERSION}"
  git push origin gh-pages
  echo "Published gh-pages for v${VERSION}"
fi

cd "$ROOT"
git worktree remove "$WORKTREE" --force 2>/dev/null || rm -rf "$WORKTREE"
git worktree prune
