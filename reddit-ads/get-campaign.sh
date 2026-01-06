#!/bin/bash
# Reddit Ads API - Get Campaign Details
# Usage: ./get-campaign.sh <campaign_id>

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

CAMPAIGN_ID="$1"

if [ -z "$CAMPAIGN_ID" ]; then
  echo "Usage: ./get-campaign.sh <campaign_id>"
  exit 1
fi

curl -s "$REDDIT_ADS_API/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq .
