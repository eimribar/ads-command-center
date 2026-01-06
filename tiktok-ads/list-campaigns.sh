#!/bin/bash

# ============================================================================
# List TikTok Ads Campaigns
# ============================================================================
# Usage: ./list-campaigns.sh [--status active|paused|all]
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Configuration
ACCESS_TOKEN="${TIKTOK_ACCESS_TOKEN}"
ADVERTISER_ID="${TIKTOK_ADVERTISER_ID}"
API_BASE="${TIKTOK_API_BASE:-https://business-api.tiktok.com/open_api/v1.3}"

# Parse arguments
STATUS="all"
while [[ $# -gt 0 ]]; do
    case $1 in
        --status) STATUS="$2"; shift 2 ;;
        *) shift ;;
    esac
done

if [[ -z "$ACCESS_TOKEN" ]]; then
    echo "Error: TIKTOK_ACCESS_TOKEN not set"
    exit 1
fi

echo "=== TikTok Ads Campaigns ==="
echo ""

# Build filter
FILTERING=""
if [[ "$STATUS" == "active" ]]; then
    FILTERING=',"filtering":{"primary_status":"STATUS_ENABLE"}'
elif [[ "$STATUS" == "paused" ]]; then
    FILTERING=',"filtering":{"primary_status":"STATUS_DISABLE"}'
fi

# Get campaigns
RESPONSE=$(curl -s -X GET "${API_BASE}/campaign/get/?advertiser_id=${ADVERTISER_ID}" \
    -H "Access-Token: $ACCESS_TOKEN" \
    -H "Content-Type: application/json")

# Check for errors
CODE=$(echo "$RESPONSE" | jq -r '.code')
if [[ "$CODE" != "0" ]]; then
    echo "Error: $(echo "$RESPONSE" | jq -r '.message')"
    exit 1
fi

# Display campaigns
echo "$RESPONSE" | jq -r '
    .data.list[]? |
    "ID: \(.campaign_id)
Name: \(.campaign_name)
Status: \(.operation_status // .primary_status)
Objective: \(.objective_type)
Budget: \(.budget // "N/A")
---"
' 2>/dev/null || echo "No campaigns found"
