#!/usr/bin/env bash
# ==============================================================================
# Aegis Preventive Health — One-Click Firebase Deployment Script
# Deploys Web App, Security Rules, and Configurations to Google Firebase Hosting
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================================="
echo "🛡️  Aegis Preventive Health & Wellness Platform"
echo "🔥 Google Firebase Hosting Deployment"
echo "=================================================================="

# Check for Node.js / npx
if ! command -v npx &> /dev/null; then
    echo "⚠️  npx is not installed or not in your current PATH."
    echo "Please install Node.js (v18+) from https://nodejs.org or via Homebrew:"
    echo "    brew install node"
    exit 1
fi

echo "1. Checking Firebase CLI..."
npx -y firebase-tools@latest --version

echo ""
echo "2. Authenticating with Google Firebase..."
echo "(If you are not logged in, a browser window will open to authenticate)"
npx -y firebase-tools@latest login

echo ""
echo "3. Active Firebase Project Status:"
ACTIVE_PROJECT=$(npx -y firebase-tools@latest use 2>&1 || true)
echo "$ACTIVE_PROJECT"

if [[ "$ACTIVE_PROJECT" == *"No project is currently active"* ]] || [[ -z "$ACTIVE_PROJECT" ]]; then
    DEFAULT_PROJECT="rugged-alcove-388517"
    echo ""
    echo "Using MediCore OS Project: $DEFAULT_PROJECT"
    npx -y firebase-tools@latest use "$DEFAULT_PROJECT"
fi

echo ""
echo "4. Deploying to Firebase Hosting & Cloud Firestore Rules..."
npx -y firebase-tools@latest deploy --only hosting,firestore

echo ""
echo "=================================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Your preventive health coach is now live worldwide on Google's CDN!"
echo "=================================================================="
