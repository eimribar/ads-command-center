#!/bin/bash

# ============================================================================
# Send Offline Conversion to Google Ads
# ============================================================================
# Usage: ./send-conversion.sh --gclid <GCLID> --action <ACTION_NAME> [--value <VALUE>] [--currency <CURRENCY>]
#
# Example:
#   ./send-conversion.sh --gclid "EAIaIQobChMI..." --action "Purchase" --value 49.99
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
GCLID=""
CONVERSION_ACTION=""
VALUE=""
CURRENCY="USD"

while [[ $# -gt 0 ]]; do
    case $1 in
        --gclid) GCLID="$2"; shift 2 ;;
        --action) CONVERSION_ACTION="$2"; shift 2 ;;
        --value) VALUE="$2"; shift 2 ;;
        --currency) CURRENCY="$2"; shift 2 ;;
        *) shift ;;
    esac
done

if [[ -z "$GCLID" || -z "$CONVERSION_ACTION" ]]; then
    echo "Usage: $0 --gclid <GCLID> --action <ACTION_NAME> [--value <VALUE>] [--currency <CURRENCY>]"
    echo ""
    echo "Example:"
    echo "  $0 --gclid 'EAIaIQobChMI...' --action 'Purchase' --value 49.99"
    exit 1
fi

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

# Get current timestamp in required format
CONVERSION_TIME=$(date -u +"%Y-%m-%d %H:%M:%S+00:00")

# Build conversion JSON
CONVERSION_JSON=$(cat <<EOF
{
    "conversions": [{
        "gclid": "$GCLID",
        "conversionAction": "customers/$CUSTOMER_ID/conversionActions/$CONVERSION_ACTION",
        "conversionDateTime": "$CONVERSION_TIME"
EOF
)

if [[ -n "$VALUE" ]]; then
    CONVERSION_JSON+=",\"conversionValue\": $VALUE,\"currencyCode\": \"$CURRENCY\""
fi

CONVERSION_JSON+="}],\"partialFailure\": true}"

echo "=== Sending Conversion to Google Ads ==="
echo "GCLID: $GCLID"
echo "Action: $CONVERSION_ACTION"
[[ -n "$VALUE" ]] && echo "Value: $VALUE $CURRENCY"
echo ""

# Send conversion
HEADERS=(-H "Authorization: Bearer $ACCESS_TOKEN")
HEADERS+=(-H "developer-token: $DEVELOPER_TOKEN")
HEADERS+=(-H "Content-Type: application/json")
[[ -n "$LOGIN_CUSTOMER_ID" ]] && HEADERS+=(-H "login-customer-id: $LOGIN_CUSTOMER_ID")

RESPONSE=$(curl -s -X POST \
    "https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER_ID}:uploadClickConversions" \
    "${HEADERS[@]}" \
    -d "$CONVERSION_JSON")

if echo "$RESPONSE" | jq -e '.results' >/dev/null 2>&1; then
    echo "✅ Conversion uploaded successfully!"
    echo "$RESPONSE" | jq '.results'
else
    echo "❌ Failed to upload conversion"
    echo "$RESPONSE" | jq -r '.error.message // .' 2>/dev/null || echo "$RESPONSE"
fi
