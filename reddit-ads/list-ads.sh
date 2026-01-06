#!/bin/bash
# Reddit Ads API - List Ads
# Usage: ./list-ads.sh [ad_group_id]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

AD_GROUP_ID="$1"

if [ -z "$AD_GROUP_ID" ]; then
  # List all ads for account
  curl -s "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/ads" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" | jq .
else
  # List ads for specific ad group
  curl -s "$REDDIT_ADS_API/ad_groups/$AD_GROUP_ID/ads" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" | jq .
fi
