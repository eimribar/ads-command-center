#!/bin/bash

# ============================================================================
# Send Conversion to TikTok Events API
# ============================================================================
# Usage: ./send-conversion.sh --event <EVENT> [--email <EMAIL>] [--value <VALUE>]
#
# Events: CompletePayment, AddToCart, ViewContent, SubmitForm, Registration, Search
#
# Example:
#   ./send-conversion.sh --event CompletePayment --email user@example.com --value 49.99
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Configuration
ACCESS_TOKEN="${TIKTOK_ACCESS_TOKEN}"
PIXEL_ID="${TIKTOK_PIXEL_ID}"
API_BASE="${TIKTOK_API_BASE:-https://business-api.tiktok.com/open_api/v1.3}"

# Parse arguments
EVENT=""
EMAIL=""
PHONE=""
VALUE=""
CURRENCY="USD"
URL=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --event) EVENT="$2"; shift 2 ;;
        --email) EMAIL="$2"; shift 2 ;;
        --phone) PHONE="$2"; shift 2 ;;
        --value) VALUE="$2"; shift 2 ;;
        --currency) CURRENCY="$2"; shift 2 ;;
        --url) URL="$2"; shift 2 ;;
        *) shift ;;
    esac
done

if [[ -z "$EVENT" ]]; then
    echo "Usage: $0 --event <EVENT> [--email <EMAIL>] [--value <VALUE>]"
    echo ""
    echo "Events: CompletePayment, AddToCart, ViewContent, SubmitForm, Registration, Search"
    exit 1
fi

if [[ -z "$ACCESS_TOKEN" || -z "$PIXEL_ID" ]]; then
    echo "Error: TIKTOK_ACCESS_TOKEN and TIKTOK_PIXEL_ID must be set"
    exit 1
fi

# Generate event ID for deduplication
EVENT_ID="evt_$(date +%s)_$(openssl rand -hex 4)"

# Get timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Hash email if provided
HASHED_EMAIL=""
if [[ -n "$EMAIL" ]]; then
    HASHED_EMAIL=$(echo -n "${EMAIL,,}" | shasum -a 256 | cut -d' ' -f1)
fi

# Hash phone if provided
HASHED_PHONE=""
if [[ -n "$PHONE" ]]; then
    HASHED_PHONE=$(echo -n "$PHONE" | shasum -a 256 | cut -d' ' -f1)
fi

# Build user context
USER_CONTEXT=""
if [[ -n "$HASHED_EMAIL" ]]; then
    USER_CONTEXT="\"email\":\"$HASHED_EMAIL\""
fi
if [[ -n "$HASHED_PHONE" ]]; then
    [[ -n "$USER_CONTEXT" ]] && USER_CONTEXT="$USER_CONTEXT,"
    USER_CONTEXT="$USER_CONTEXT\"phone_number\":\"$HASHED_PHONE\""
fi

# Build properties
PROPERTIES=""
if [[ -n "$VALUE" ]]; then
    PROPERTIES="\"currency\":\"$CURRENCY\",\"value\":$VALUE"
fi

# Build page context
PAGE_CONTEXT="\"url\":\"${URL:-https://www.agentss.ai}\""

echo "=== Sending Conversion to TikTok ==="
echo "Event: $EVENT"
echo "Event ID: $EVENT_ID"
[[ -n "$EMAIL" ]] && echo "Email: $EMAIL (hashed)"
[[ -n "$VALUE" ]] && echo "Value: $VALUE $CURRENCY"
echo ""

# Build request body
REQUEST_BODY=$(cat <<EOF
{
    "pixel_code": "$PIXEL_ID",
    "event": "$EVENT",
    "event_id": "$EVENT_ID",
    "timestamp": "$TIMESTAMP",
    "context": {
        "user": {${USER_CONTEXT}},
        "page": {${PAGE_CONTEXT}}
    },
    "properties": {${PROPERTIES}}
}
EOF
)

# Send event
RESPONSE=$(curl -s -X POST "${API_BASE}/pixel/track/" \
    -H "Access-Token: $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_BODY")

# Check response
CODE=$(echo "$RESPONSE" | jq -r '.code')
if [[ "$CODE" == "0" ]]; then
    echo "Conversion sent successfully!"
else
    echo "Error: $(echo "$RESPONSE" | jq -r '.message')"
    echo "$RESPONSE" | jq .
fi
