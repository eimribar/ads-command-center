#!/bin/bash
# Reddit Ads API - Update Campaign
# Usage: ./update-campaign.sh <campaign_id> <json_payload>
# Example: ./update-campaign.sh c_abc123 '{"configured_status": "ACTIVE"}'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

CAMPAIGN_ID="$1"
PAYLOAD="$2"

if [ -z "$CAMPAIGN_ID" ] || [ -z "$PAYLOAD" ]; then
  echo "Usage: ./update-campaign.sh <campaign_id> '<json_payload>'"
  echo "Example: ./update-campaign.sh c_abc123 '{\"configured_status\": \"ACTIVE\"}'"
  exit 1
fi

curl -s -X PATCH "$REDDIT_ADS_API/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq .
