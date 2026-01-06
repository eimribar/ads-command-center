#!/bin/bash

# ============================================================================
# Update Google Ads Campaign
# ============================================================================
# Usage: ./update-campaign.sh --id <CAMPAIGN_ID> --action <pause|resume>
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Configuration
DEVELOPER_TOKEN="${GOOGLE_ADS_DEVELOPER_TOKEN}"
CLIENT_ID="${GOOGLE_ADS_CLIENT_ID}"
CLIENT_SECRET="${GOOGLE_ADS_CLIENT_SECRET}"
REFRESH_TOKEN="${GOOGLE_ADS_REFRESH_TOKEN}"
CUSTOMER_ID="${GOOGLE_ADS_CUSTOMER_ID}"
LOGIN_CUSTOMER_ID="${GOOGLE_ADS_LOGIN_CUSTOMER_ID}"
API_VERSION="v18"

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
    echo "  $0 --id 123456789 --action pause"
    echo "  $0 --id 123456789 --action resume"
    exit 1
fi

# Determine status
case $ACTION in
    pause) STATUS="PAUSED" ;;
    resume) STATUS="ENABLED" ;;
    *) echo "Invalid action: $ACTION (use 'pause' or 'resume')"; exit 1 ;;
esac

# Get fresh access token
ACCESS_TOKEN=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
    -d "refresh_token=$REFRESH_TOKEN" \
    -d "client_id=$CLIENT_ID" \
    -d "client_secret=$CLIENT_SECRET" \
    -d "grant_type=refresh_token" | jq -r '.access_token')

if [[ -z "$ACCESS_TOKEN" || "$ACCESS_TOKEN" == "null" ]]; then
    echo "❌ Error: Failed to get access token"
    exit 1
fi

echo "=== Updating Campaign $CAMPAIGN_ID ==="
echo "Action: $ACTION → Status: $STATUS"
echo ""

# Build mutation request
MUTATION_JSON=$(cat <<EOF
{
    "operations": [{
        "update": {
            "resourceName": "customers/$CUSTOMER_ID/campaigns/$CAMPAIGN_ID",
            "status": "$STATUS"
        },
        "updateMask": "status"
    }]
}
EOF
)

# Send mutation
HEADERS=(-H "Authorization: Bearer $ACCESS_TOKEN")
HEADERS+=(-H "developer-token: $DEVELOPER_TOKEN")
HEADERS+=(-H "Content-Type: application/json")
[[ -n "$LOGIN_CUSTOMER_ID" ]] && HEADERS+=(-H "login-customer-id: $LOGIN_CUSTOMER_ID")

RESPONSE=$(curl -s -X POST \
    "https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER_ID}/campaigns:mutate" \
    "${HEADERS[@]}" \
    -d "$MUTATION_JSON")

if echo "$RESPONSE" | jq -e '.results' >/dev/null 2>&1; then
    echo "✅ Campaign updated successfully!"
else
    echo "❌ Failed to update campaign"
    echo "$RESPONSE" | jq -r '.error.message // .' 2>/dev/null || echo "$RESPONSE"
fi
