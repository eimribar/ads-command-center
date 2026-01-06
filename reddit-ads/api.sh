#!/bin/bash
# Reddit Ads API - Generic API Request
# Usage: ./api.sh <method> <endpoint> [json_payload]
# Example: ./api.sh GET /ad_accounts/a2_xxx/campaigns
# Example: ./api.sh POST /ad_accounts/a2_xxx/campaigns '{"name": "Test"}'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

METHOD="${1:-GET}"
ENDPOINT="$2"
PAYLOAD="$3"

if [ -z "$ENDPOINT" ]; then
  echo "Usage: ./api.sh <method> <endpoint> [json_payload]"
  echo ""
  echo "Examples:"
  echo "  ./api.sh GET /me"
  echo "  ./api.sh GET /ad_accounts/$REDDIT_AD_ACCOUNT_ID/campaigns"
  echo "  ./api.sh POST /ad_accounts/$REDDIT_AD_ACCOUNT_ID/campaigns '{\"name\": \"Test\"}'"
  exit 1
fi

# Build full URL
URL="$REDDIT_ADS_API$ENDPOINT"

if [ -n "$PAYLOAD" ]; then
  curl -s -X "$METHOD" "$URL" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" | jq .
else
  curl -s -X "$METHOD" "$URL" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" | jq .
fi
