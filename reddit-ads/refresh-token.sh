#!/bin/bash
# Reddit Ads API - Refresh Access Token
# Usage: ./refresh-token.sh

set -e

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

echo "Refreshing Reddit Ads API access token..."

RESPONSE=$(curl -s -X POST https://www.reddit.com/api/v1/access_token \
  -A 'Claude-Code-Ads' \
  -u "$REDDIT_APP_ID:$REDDIT_SECRET" \
  -d "grant_type=refresh_token&refresh_token=$REDDIT_REFRESH_TOKEN")

# Extract new tokens
NEW_ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')
NEW_REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token')
EXPIRES_IN=$(echo "$RESPONSE" | jq -r '.expires_in')

if [ "$NEW_ACCESS_TOKEN" == "null" ] || [ -z "$NEW_ACCESS_TOKEN" ]; then
  echo "Error refreshing token:"
  echo "$RESPONSE"
  exit 1
fi

echo "Token refreshed successfully!"
echo "Expires in: $EXPIRES_IN seconds ($(($EXPIRES_IN / 3600)) hours)"

# Update .env file with new tokens
sed -i '' "s|^REDDIT_ACCESS_TOKEN=.*|REDDIT_ACCESS_TOKEN=\"$NEW_ACCESS_TOKEN\"|" "$SCRIPT_DIR/.env"

if [ "$NEW_REFRESH_TOKEN" != "null" ] && [ -n "$NEW_REFRESH_TOKEN" ]; then
  sed -i '' "s|^REDDIT_REFRESH_TOKEN=.*|REDDIT_REFRESH_TOKEN=\"$NEW_REFRESH_TOKEN\"|" "$SCRIPT_DIR/.env"
fi

echo "Updated .env file with new tokens."
echo ""
echo "New access token (first 50 chars): ${NEW_ACCESS_TOKEN:0:50}..."
