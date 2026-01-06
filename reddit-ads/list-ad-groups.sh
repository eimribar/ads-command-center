#!/bin/bash
# Reddit Ads API - List Ad Groups
# Usage: ./list-ad-groups.sh [campaign_id]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

CAMPAIGN_ID="$1"

if [ -z "$CAMPAIGN_ID" ]; then
  # List all ad groups for account
  curl -s "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/ad_groups" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" | jq .
else
  # List ad groups for specific campaign
  curl -s "$REDDIT_ADS_API/campaigns/$CAMPAIGN_ID/ad_groups" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" | jq .
fi
