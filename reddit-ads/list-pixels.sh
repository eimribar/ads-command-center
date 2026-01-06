#!/bin/bash
# Reddit Ads API - List Conversion Pixels
# Usage: ./list-pixels.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

curl -s "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/pixels" \
  -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq .
