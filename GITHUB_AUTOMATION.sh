#!/bin/bash
# GitHub Automation Script for Orbit v1.0.0 Release
# Run this script to create GitHub Release and merge PR

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   🛰️  GitHub Release Automation for Orbit v1.0.0            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "🔑 GitHub CLI authentication required..."
    echo "Please run: gh auth login"
    echo "Choose: GitHub.com → HTTPS → Login with a web browser"
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Navigate to repository
cd /orbit

# Step 1: Create GitHub Release
echo "📦 Step 1: Creating GitHub Release v1.0.0..."
echo ""

gh release create v1.0.0 \
    --title "Orbit v1.0.0 - First Stable Release" \
    --notes-file RELEASE_NOTES_v1.0.0.md \
    dist/orbit-1.0.0-linux-amd64.tar.gz \
    dist/orbit-1.0.0-linux-arm64.tar.gz \
    dist/SHA256SUMS \
    --target go-rewrite

echo ""
echo "✅ GitHub Release created!"
echo ""

# Step 2: Create Pull Request
echo "🔀 Step 2: Creating Pull Request (go-rewrite → main)..."
echo ""

gh pr create \
    --base main \
    --head go-rewrite \
    --title "Orbit v1.0.0 - Complete Go Rewrite" \
    --body-file PR_DESCRIPTION.md \
    --assignee @me

echo ""
echo "✅ Pull Request created!"
echo ""

# Step 3: Get PR number and merge
echo "🔀 Step 3: Merging Pull Request..."
echo ""

# Get the PR number
PR_NUMBER=$(gh pr list --head go-rewrite --json number --jq '.[0].number')

if [ -z "$PR_NUMBER" ]; then
    echo "❌ Could not find PR. Please merge manually."
    exit 1
fi

echo "Found PR #${PR_NUMBER}"
echo ""
echo "Do you want to merge now? (y/n)"
read -r RESPONSE

if [[ "$RESPONSE" =~ ^[Yy]$ ]]; then
    gh pr merge $PR_NUMBER --merge --delete-branch=false
    echo "✅ Pull Request merged!"
else
    echo "⏸️  Merge skipped. You can merge later with:"
    echo "   gh pr merge $PR_NUMBER --merge"
fi

echo ""

# Step 4: Add GitHub Topics
echo "🏷️  Step 4: Adding GitHub Topics..."
echo ""

gh repo edit \
    --add-topic server-management \
    --add-topic go \
    --add-topic golang \
    --add-topic ubuntu \
    --add-topic debian \
    --add-topic monitoring \
    --add-topic system-administration \
    --add-topic web-panel \
    --add-topic devops

echo "✅ GitHub Topics added!"
echo ""

# Step 5: Update repository description
echo "📝 Step 5: Updating repository description..."
echo ""

gh repo edit \
    --description "🛰️ Lightweight server management panel for Ubuntu/Debian. Built with Go. Monitor system, manage packages, services, network, users, and configs through a modern web UI." \
    --homepage "https://github.com/grosman-net/orbit"

echo "✅ Repository description updated!"
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   ✅ ALL TASKS COMPLETED SUCCESSFULLY!                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "🔗 Links:"
echo "   • Release: https://github.com/grosman-net/orbit/releases/tag/v1.0.0"
echo "   • Pull Request: https://github.com/grosman-net/orbit/pull/${PR_NUMBER}"
echo "   • Repository: https://github.com/grosman-net/orbit"
echo ""
echo "🎉 Orbit v1.0.0 is now live!"

