#!/bin/bash
# Get Meta Pixel Statistics
# Usage: ./get-pixel-stats.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env"

echo "=== Meta Pixel Stats (Last 7 Days) ==="

curl -s "https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/stats?aggregation=event&access_token=${META_ACCESS_TOKEN}" | jq .
