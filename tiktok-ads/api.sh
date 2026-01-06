#!/bin/bash

# ============================================================================
# TikTok Ads API Helper
# ============================================================================
# Usage: ./api.sh <endpoint> [method] [data]
#
# Example:
#   ./api.sh /advertiser/info GET
#   ./api.sh /campaign/get POST '{"advertiser_id":"123","page":1}'
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Configuration
ACCESS_TOKEN="${TIKTOK_ACCESS_TOKEN}"
ADVERTISER_ID="${TIKTOK_ADVERTISER_ID}"
API_BASE="${TIKTOK_API_BASE:-https://business-api.tiktok.com/open_api/v1.3}"

# Parse arguments
ENDPOINT="${1:-/advertiser/info}"
METHOD="${2:-GET}"
DATA="${3:-}"

if [[ -z "$ACCESS_TOKEN" ]]; then
    echo "Error: TIKTOK_ACCESS_TOKEN not set"
    exit 1
fi

# Build URL
URL="${API_BASE}${ENDPOINT}"

# Make request
if [[ "$METHOD" == "GET" ]]; then
    curl -s -X GET "$URL" \
        -H "Access-Token: $ACCESS_TOKEN" \
        -H "Content-Type: application/json"
else
    if [[ -z "$DATA" ]]; then
        DATA="{\"advertiser_id\":\"$ADVERTISER_ID\"}"
    fi
    curl -s -X POST "$URL" \
        -H "Access-Token: $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$DATA"
fi
