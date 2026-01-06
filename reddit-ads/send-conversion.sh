#!/bin/bash
# Reddit Conversions API (CAPI) - v2.0 Endpoint
# Usage: ./send-conversion.sh <event_type> [email] [click_id]
# Event types: PageVisit, ViewContent, Search, AddToCart, AddToWishlist, Purchase, Lead, SignUp, Custom

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Reddit API credentials (hardcoded to avoid shell parsing issues with JWT tokens)
APP_ID="-QRVvUbpickX6qOwx-mxbg"
SECRET="H3EJGsRaHE0tsh2i1uY4ZAOmA4XLOA"
REFRESH_TOKEN="827032427930-UWv8DSCBeVfjhZOxJD3ucKQvrOmv_A"
AD_ACCOUNT_ID="a2_gu5cal6xbcpp"

# Get fresh access token (tokens expire every 24 hours)
ACCESS_TOKEN=$(curl -s -X POST "https://www.reddit.com/api/v1/access_token" \
    -u "$APP_ID:$SECRET" \
    -A "Agentss/1.0" \
    -d "grant_type=refresh_token&refresh_token=$REFRESH_TOKEN" | jq -r '.access_token')

EVENT_TYPE="${1:-PageVisit}"
EMAIL="$2"
CLICK_ID="$3"

TIMESTAMP=$(date +%s)

# Build user object
USER_OBJ="{}"
if [ -n "$EMAIL" ]; then
  # SHA256 hash the email (lowercase, trimmed)
  EMAIL_HASH=$(echo -n "$EMAIL" | tr '[:upper:]' '[:lower:]' | tr -d ' ' | shasum -a 256 | cut -d' ' -f1)
  USER_OBJ="{\"email\": \"$EMAIL_HASH\"}"
fi

# Generate unique conversion ID
CONVERSION_ID="agentss_$(date +%s)_$(openssl rand -hex 4)"
EVENT_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Build event data with event_metadata
if [ -n "$CLICK_ID" ]; then
  EVENT_DATA="{
    \"events\": [{
      \"event_at\": \"$EVENT_TIME\",
      \"event_type\": {\"tracking_type\": \"$EVENT_TYPE\"},
      \"click_id\": \"$CLICK_ID\",
      \"user\": $USER_OBJ,
      \"event_metadata\": {
        \"conversion_id\": \"$CONVERSION_ID\",
        \"item_count\": 1
      }
    }],
    \"test_mode\": false
  }"
else
  EVENT_DATA="{
    \"events\": [{
      \"event_at\": \"$EVENT_TIME\",
      \"event_type\": {\"tracking_type\": \"$EVENT_TYPE\"},
      \"user\": $USER_OBJ,
      \"event_metadata\": {
        \"conversion_id\": \"$CONVERSION_ID\",
        \"item_count\": 1
      }
    }],
    \"test_mode\": false
  }"
fi

echo "Sending $EVENT_TYPE event to Reddit CAPI (v2.0)..."
echo "Account: $AD_ACCOUNT_ID"
echo ""

# Use the correct v2.0 conversions endpoint (NOT v3!)
RESPONSE=$(curl -s -X POST "https://ads-api.reddit.com/api/v2.0/conversions/events/$AD_ACCOUNT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$EVENT_DATA")

echo "$RESPONSE" | jq .
