#!/bin/bash
# Reddit Ads API - List Campaigns
# Usage: ./list-campaigns.sh [account_id]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

ACCOUNT_ID="${1:-$REDDIT_AD_ACCOUNT_ID}"

curl -s "$REDDIT_ADS_API/ad_accounts/$ACCOUNT_ID/campaigns" \
  -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq .
