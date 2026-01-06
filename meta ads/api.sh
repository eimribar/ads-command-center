#!/bin/bash
# Meta Graph API - Generic request helper
# Usage: ./api.sh GET /me
#        ./api.sh GET /1146945313925793?fields=name
#        ./api.sh POST /1146945313925793/events '{"data":[...]}'

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env"

METHOD="${1:-GET}"
ENDPOINT="${2:-/me}"
DATA="$3"

BASE_URL="https://graph.facebook.com/${META_API_VERSION}"

# Remove leading slash if present
ENDPOINT="${ENDPOINT#/}"

if [ "$METHOD" = "GET" ]; then
    curl -s "${BASE_URL}/${ENDPOINT}&access_token=${META_ACCESS_TOKEN}" 2>/dev/null || \
    curl -s "${BASE_URL}/${ENDPOINT}?access_token=${META_ACCESS_TOKEN}"
elif [ "$METHOD" = "POST" ]; then
    if [ -n "$DATA" ]; then
        curl -s -X POST "${BASE_URL}/${ENDPOINT}" \
            -H "Content-Type: application/json" \
            -d "{\"access_token\":\"${META_ACCESS_TOKEN}\",${DATA#\{}"
    else
        curl -s -X POST "${BASE_URL}/${ENDPOINT}?access_token=${META_ACCESS_TOKEN}"
    fi
else
    echo "Usage: $0 GET|POST <endpoint> [json_data]"
    exit 1
fi
