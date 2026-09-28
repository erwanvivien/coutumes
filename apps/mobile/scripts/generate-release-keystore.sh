#!/usr/bin/env bash
# Run this ONCE, interactively, to create the Android upload keystore.
# Losing this file (or forgetting its passwords) means you can never ship an
# update to an app already published under it (unless Play App Signing is
# enrolled) -- back it up somewhere durable outside this repo (it is
# gitignored on purpose).
#
# Usage: ./scripts/generate-release-keystore.sh [output-path]

set -euo pipefail

OUTPUT_PATH="${1:-$(dirname "$0")/../upload-keystore.jks}"
mkdir -p "$(dirname "$OUTPUT_PATH")"

if [ -f "$OUTPUT_PATH" ]; then
  echo "Refusing to overwrite existing keystore at $OUTPUT_PATH" >&2
  exit 1
fi

keytool -genkeypair -v \
  -storetype JKS \
  -keystore "$OUTPUT_PATH" \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

echo
echo "Keystore created at $OUTPUT_PATH"
echo "Set these before running 'fastlane android release':"
echo "  export MOBILE_ANDROID_RELEASE_STORE_FILE=\"$(cd "$(dirname "$OUTPUT_PATH")" && pwd)/$(basename "$OUTPUT_PATH")\""
echo "  export MOBILE_ANDROID_RELEASE_STORE_PASSWORD=<the store password you just entered>"
echo "  export MOBILE_ANDROID_RELEASE_KEY_ALIAS=upload"
echo "  export MOBILE_ANDROID_RELEASE_KEY_PASSWORD=<the key password you just entered>"
