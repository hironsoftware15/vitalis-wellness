#!/bin/bash
# ==============================================================================
# Aegis Preventive Health - Android App Bundle (.aab) Build & Keystore Utility
# ==============================================================================

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
KEYSTORE_PATH="$ANDROID_DIR/app/keystore.jks"
KEY_ALIAS="medicore"

echo "=========================================================="
echo " Aegis Preventive Health - Standalone Google Play Builder "
echo " Package ID: com.medicore.wellness"
echo " Host: https://medicore-wellness.web.app"
echo "=========================================================="

# 1. Check for Java / keytool
if ! command -v keytool &> /dev/null; then
    echo "⚠️  'keytool' not found. Please ensure OpenJDK 17 or Android Studio is installed."
    echo "    On macOS: brew install openjdk@17"
    exit 1
fi

# 2. Check / Generate Keystore
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "🔑 Generating release keystore at: $KEYSTORE_PATH"
    keytool -genkey -v \
        -keystore "$KEYSTORE_PATH" \
        -alias "$KEY_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass medicorepass \
        -keypass medicorepass \
        -dname "CN=MediCore Aegis, OU=Health Tech, O=MediCore Health Inc, L=San Francisco, ST=CA, C=US"
    echo "✅ Keystore created successfully!"
else
    echo "ℹ️  Using existing keystore: $KEYSTORE_PATH"
fi

# 3. Extract SHA-256 Certificate Fingerprint
echo "🔍 Extracting SHA-256 Fingerprint for Digital Asset Links..."
SHA256_FINGERPRINT=$(keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$KEY_ALIAS" -storepass medicorepass | grep "SHA256:" | awk '{print $2}')
echo "👉 SHA-256: $SHA256_FINGERPRINT"

# 4. Update assetlinks.json
ASSETLINKS_FILE="$PROJECT_ROOT/.well-known/assetlinks.json"
cat <<EOF > "$ASSETLINKS_FILE"
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.medicore.wellness",
      "sha256_cert_fingerprints": [
        "$SHA256_FINGERPRINT"
      ]
    }
  }
]
EOF
echo "✅ Updated $ASSETLINKS_FILE with active keystore SHA-256 fingerprint."

# 5. Build Release Bundle
echo "🚀 Building Release Android App Bundle (.aab)..."
cd "$ANDROID_DIR"
if command -v ./gradlew &> /dev/null; then
    ./gradlew bundleRelease
    echo "✅ Build complete!"
    echo "📦 Bundle Output: $ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
else
    echo "ℹ️  Gradle wrapper ready. When ready with JDK 17, run:"
    echo "    cd android && ./gradlew bundleRelease"
fi
