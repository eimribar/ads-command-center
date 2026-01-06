#!/bin/bash
# Reddit Ads API - Create Campaign
# Usage: ./create-campaign.sh <name> <objective> <daily_budget_cents>
# Objectives: AWARENESS, CONSIDERATION, CONVERSIONS, VIDEO_VIEWS, APP_INSTALLS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

NAME="$1"
OBJECTIVE="${2:-AWARENESS}"
DAILY_BUDGET="${3:-1000}"  # in cents, default $10

if [ -z "$NAME" ]; then
  echo "Usage: ./create-campaign.sh <name> [objective] [daily_budget_cents]"
  echo "Objectives: AWARENESS, CONSIDERATION, CONVERSIONS, VIDEO_VIEWS, APP_INSTALLS"
  exit 1
fi

curl -s -X POST "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/campaigns" \
  -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"name\": \"$NAME\",
      \"objective\": \"$OBJECTIVE\",
      \"configured_status\": \"PAUSED\"
    }
  }" | jq .
