#!/bin/bash
# Meta Conversions API - Send server-side events
# Usage: ./send-conversion.sh Purchase user@email.com [order_id] [value]
#        ./send-conversion.sh AddToCart user@email.com
#        ./send-conversion.sh Lead user@email.com
#        ./send-conversion.sh ViewContent
#        ./send-conversion.sh InitiateCheckout user@email.com [value]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env"

EVENT_NAME="${1:-PageView}"
EMAIL="${2:-}"
ORDER_ID="${3:-}"
VALUE="${4:-0}"

# Generate event timestamp (Unix time)
EVENT_TIME=$(date +%s)

# Generate event ID for deduplication
EVENT_ID="${EVENT_NAME}_$(date +%s)_$(openssl rand -hex 4)"

# Hash email if provided (SHA256, lowercase, trimmed)
HASHED_EMAIL=""
if [ -n "$EMAIL" ]; then
    HASHED_EMAIL=$(echo -n "$EMAIL" | tr '[:upper:]' '[:lower:]' | tr -d ' ' | openssl dgst -sha256 | awk '{print $2}')
fi

# Build user data object
USER_DATA="{\"client_user_agent\":\"Mozilla/5.0 (Server-Side Event)\"}"
if [ -n "$HASHED_EMAIL" ]; then
    USER_DATA="{\"em\":[\"$HASHED_EMAIL\"],\"client_user_agent\":\"Mozilla/5.0 (Server-Side Event)\"}"
fi

# Build custom data based on event type
CUSTOM_DATA="{}"
case "$EVENT_NAME" in
    "Purchase")
        if [ -n "$ORDER_ID" ]; then
            CUSTOM_DATA="{\"currency\":\"USD\",\"value\":$VALUE,\"order_id\":\"$ORDER_ID\"}"
        else
            CUSTOM_DATA="{\"currency\":\"USD\",\"value\":$VALUE}"
        fi
        ;;
    "AddToCart"|"InitiateCheckout"|"ViewContent")
        if [ "$VALUE" != "0" ]; then
            CUSTOM_DATA="{\"currency\":\"USD\",\"value\":$VALUE}"
        fi
        ;;
esac

# Build the event payload
EVENT_PAYLOAD=$(cat <<EOF
{
    "data": [
        {
            "event_name": "$EVENT_NAME",
            "event_time": $EVENT_TIME,
            "event_id": "$EVENT_ID",
            "event_source_url": "https://www.agentss.ai",
            "action_source": "website",
            "user_data": $USER_DATA,
            "custom_data": $CUSTOM_DATA
        }
    ]
}
EOF
)

echo "=== Sending $EVENT_NAME event to Meta CAPI ==="
echo "Event ID: $EVENT_ID"
echo "Payload:"
echo "$EVENT_PAYLOAD" | jq .

# Send the event
RESPONSE=$(curl -s -X POST "https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events" \
    -H "Content-Type: application/json" \
    -d "{\"access_token\":\"${META_ACCESS_TOKEN}\",\"data\":$(echo "$EVENT_PAYLOAD" | jq -c '.data')}")

echo ""
echo "=== Response ==="
echo "$RESPONSE" | jq .
