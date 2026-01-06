#!/bin/bash

# ============================================================================
# Update TikTok Ads Campaign
# ============================================================================
# Usage: ./update-campaign.sh --id <CAMPAIGN_ID> --action <pause|resume>
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Configuration
ACCESS_TOKEN="${TIKTOK_ACCESS_TOKEN}"
ADVERTISER_ID="${TIKTOK_ADVERTISER_ID}"
API_BASE="${TIKTOK_API_BASE:-https://business-api.tiktok.com/open_api/v1.3}"

# Parse arguments
CAMPAIGN_ID=""
ACTION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --id) CAMPAIGN_ID="$2"; shift 2 ;;
        --action) ACTION="$2"; shift 2 ;;
        *) shift ;;
    esac
done

if [[ -z "$CAMPAIGN_ID" || -z "$ACTION" ]]; then
    echo "Usage: $0 --id <CAMPAIGN_ID> --action <pause|resume>"
    echo ""
    echo "Example:"
    echo "  $0 --id 1234567890 --action pause"
    echo "  $0 --id 1234567890 --action resume"
    exit 1
fi

# Determine status
case $ACTION in
    pause) STATUS="DISABLE" ;;
    resume) STATUS="ENABLE" ;;
    *) echo "Invalid action: $ACTION (use 'pause' or 'resume')"; exit 1 ;;
esac

if [[ -z "$ACCESS_TOKEN" ]]; then
    echo "Error: TIKTOK_ACCESS_TOKEN not set"
    exit 1
fi

echo "=== Updating TikTok Campaign $CAMPAIGN_ID ==="
echo "Action: $ACTION -> Status: $STATUS"
echo ""

# Build request
REQUEST_BODY=$(cat <<EOF
{
    "advertiser_id": "$ADVERTISER_ID",
    "campaign_ids": ["$CAMPAIGN_ID"],
    "operation_status": "$STATUS"
}
EOF
)

# Send update
RESPONSE=$(curl -s -X POST "${API_BASE}/campaign/update/status/" \
    -H "Access-Token: $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_BODY")

# Check response
CODE=$(echo "$RESPONSE" | jq -r '.code')
if [[ "$CODE" == "0" ]]; then
    echo "Campaign updated successfully!"
else
    echo "Error: $(echo "$RESPONSE" | jq -r '.message')"
fi
