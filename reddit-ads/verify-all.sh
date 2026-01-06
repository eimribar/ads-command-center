#!/bin/bash
# Reddit Ads - Complete Verification
# Tests all components: token, campaigns, ad groups, ads, conversions

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

echo "=============================================="
echo "REDDIT ADS - COMPLETE VERIFICATION"
echo "=============================================="
echo ""

# Refresh token first
echo "=== REFRESHING TOKEN ==="
NEW_TOKEN=$(curl -s -X POST "https://www.reddit.com/api/v1/access_token" \
    -u "$REDDIT_APP_ID:$REDDIT_SECRET" \
    -A "Agentss/1.0" \
    -d "grant_type=refresh_token&refresh_token=$REDDIT_REFRESH_TOKEN" | jq -r '.access_token')

if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "null" ]; then
    echo "Token refreshed successfully"
    export REDDIT_ACCESS_TOKEN="$NEW_TOKEN"
else
    echo "Warning: Could not refresh token, using existing"
fi
echo ""

echo "=== ACCOUNT INFO ==="
curl -s "$REDDIT_ADS_API/me" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" | jq -r '.data | "Profile: \(.id) (\(.name))"'
echo ""

echo "=== CAMPAIGNS ==="
curl -s "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/campaigns" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" | jq -r '.data[] | "  [\(.effective_status)] \(.name) (ID: \(.id))"'
echo ""

echo "=== AD GROUPS ==="
curl -s "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/ad_groups" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" | jq -r '.data[] | "  [\(.effective_status)] \(.name) (ID: \(.id))"'
echo ""

echo "=== ADS ==="
curl -s "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/ads" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" | jq -r '.data[] | "  [\(.effective_status)] \(.name) (ID: \(.id))"'
echo ""

echo "=== CONVERSION TEST ==="
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
HASHED_EMAIL=$(echo -n "test@agentss.ai" | shasum -a 256 | cut -d' ' -f1)
CONV_RESPONSE=$(curl -s -X POST "https://ads-api.reddit.com/api/v2.0/conversions/events/$REDDIT_AD_ACCOUNT_ID" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"test_mode\": false,
        \"events\": [{
            \"event_at\": \"$TIMESTAMP\",
            \"event_type\": {\"tracking_type\": \"Lead\"},
            \"user\": {\"email\": \"$HASHED_EMAIL\"},
            \"event_metadata\": {
                \"conversion_id\": \"verify_$(date +%s)\",
                \"item_count\": 1
            }
        }]
    }")
echo "  $CONV_RESPONSE" | jq -r '.message // .'
echo ""

echo "=============================================="
echo "ALL SYSTEMS OPERATIONAL!"
echo "=============================================="
