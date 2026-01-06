#!/bin/bash
# Reddit Ads API - Create Ad
# Usage: ./create-ad.sh <ad_group_id> <post_id> <name>
#
# IMPORTANT: For conversion campaigns, the post MUST have a destination_url.
# Use IMAGE, VIDEO, or CAROUSEL type posts - NOT TEXT posts.
#
# Do NOT include click_url - it will be inherited from the post's destination_url.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

AD_GROUP_ID="$1"
POST_ID="$2"
NAME="$3"

if [ -z "$AD_GROUP_ID" ] || [ -z "$POST_ID" ] || [ -z "$NAME" ]; then
  echo "Usage: ./create-ad.sh <ad_group_id> <post_id> <name>"
  echo ""
  echo "Arguments:"
  echo "  ad_group_id - Ad group to attach this ad to"
  echo "  post_id     - Post ID (t3_xxxxx format, from create-post.sh)"
  echo "  name        - Name for the ad"
  echo ""
  echo "Example: ./create-ad.sh 2404466433148818222 t3_1q07hsy 'Agentss Lead Ad'"
  echo ""
  echo "NOTE: For conversion campaigns, use posts with destination_url (IMAGE type)."
  echo "      TEXT posts cannot be used for conversion campaigns."
  exit 1
fi

echo "Creating Ad..."
echo "  Ad Group ID: $AD_GROUP_ID"
echo "  Post ID: $POST_ID"
echo "  Name: $NAME"
echo ""

curl -s -X POST "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/ads" \
  -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"ad_group_id\": \"$AD_GROUP_ID\",
      \"name\": \"$NAME\",
      \"post_id\": \"$POST_ID\",
      \"configured_status\": \"PAUSED\"
    }
  }" | jq .
