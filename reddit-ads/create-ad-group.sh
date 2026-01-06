#!/bin/bash
# Reddit Ads API - Create Ad Group (for Conversion campaigns)
# Usage: ./create-ad-group.sh <campaign_id> <name> [optimization_goal]
#
# Required for CONVERSIONS objective campaigns:
# - bid_strategy, bid_type, bid_value, goal_value
# - optimization_goal, view_through_conversion_type
# - start_time, targeting (geolocations)
#
# Optimization Goals: LEAD, PAGE_VISIT, PURCHASE, SIGN_UP, ADD_TO_CART

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

CAMPAIGN_ID="$1"
NAME="$2"
OPT_GOAL="${3:-LEAD}"
GEO="${4:-US}"

if [ -z "$CAMPAIGN_ID" ] || [ -z "$NAME" ]; then
  echo "Usage: ./create-ad-group.sh <campaign_id> <name> [optimization_goal] [geo]"
  echo ""
  echo "Arguments:"
  echo "  campaign_id       - Campaign ID to attach this ad group to"
  echo "  name              - Name for the ad group"
  echo "  optimization_goal - LEAD, PAGE_VISIT, PURCHASE, SIGN_UP, ADD_TO_CART (default: LEAD)"
  echo "  geo               - Country code (default: US)"
  echo ""
  echo "Example: ./create-ad-group.sh 2404462911986962808 'US Leads' LEAD US"
  exit 1
fi

# Generate start_time (current time in ISO 8601 format)
START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Creating Ad Group..."
echo "  Campaign ID: $CAMPAIGN_ID"
echo "  Name: $NAME"
echo "  Optimization: $OPT_GOAL"
echo "  Geo: $GEO"
echo "  Start: $START_TIME"
echo ""

curl -s -X POST "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/ad_groups" \
  -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"campaign_id\": \"$CAMPAIGN_ID\",
      \"name\": \"$NAME\",
      \"configured_status\": \"PAUSED\",
      \"bid_strategy\": \"MAXIMIZE_VOLUME\",
      \"bid_type\": \"CPC\",
      \"bid_value\": 500000,
      \"goal_value\": 5000000,
      \"optimization_goal\": \"$OPT_GOAL\",
      \"view_through_conversion_type\": \"SEVEN_DAY_CLICKS_ONE_DAY_VIEW\",
      \"start_time\": \"$START_TIME\",
      \"targeting\": {
        \"geolocations\": [\"$GEO\"]
      }
    }
  }" | jq .
