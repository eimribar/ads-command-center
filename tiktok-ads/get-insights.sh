#!/bin/bash

# ============================================================================
# Get TikTok Ads Performance Insights
# ============================================================================
# Usage: ./get-insights.sh [--days N]
# Default: Last 7 days
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Configuration
ACCESS_TOKEN="${TIKTOK_ACCESS_TOKEN}"
ADVERTISER_ID="${TIKTOK_ADVERTISER_ID}"
API_BASE="${TIKTOK_API_BASE:-https://business-api.tiktok.com/open_api/v1.3}"

# Parse arguments
DAYS=7
while [[ $# -gt 0 ]]; do
    case $1 in
        --days) DAYS=$2; shift 2 ;;
        *) shift ;;
    esac
done

# Calculate date range
if [[ "$OSTYPE" == "darwin"* ]]; then
    START_DATE=$(date -v-${DAYS}d +%Y-%m-%d)
    END_DATE=$(date -v-1d +%Y-%m-%d)
else
    START_DATE=$(date -d "$DAYS days ago" +%Y-%m-%d)
    END_DATE=$(date -d "yesterday" +%Y-%m-%d)
fi

if [[ -z "$ACCESS_TOKEN" ]]; then
    echo "Error: TIKTOK_ACCESS_TOKEN not set"
    exit 1
fi

echo "=== TikTok Ads Performance ($START_DATE to $END_DATE) ==="
echo ""

# Get integrated report
RESPONSE=$(curl -s -X GET \
    "${API_BASE}/report/integrated/get/?advertiser_id=${ADVERTISER_ID}&report_type=BASIC&dimensions=%5B%22stat_time_day%22%5D&data_level=AUCTION_ADVERTISER&start_date=${START_DATE}&end_date=${END_DATE}&metrics=%5B%22spend%22%2C%22impressions%22%2C%22clicks%22%2C%22ctr%22%2C%22conversion%22%2C%22cost_per_conversion%22%2C%22total_complete_payment%22%2C%22complete_payment_rate%22%5D" \
    -H "Access-Token: $ACCESS_TOKEN" \
    -H "Content-Type: application/json")

# Check for errors
CODE=$(echo "$RESPONSE" | jq -r '.code')
if [[ "$CODE" != "0" ]]; then
    echo "Error: $(echo "$RESPONSE" | jq -r '.message')"
    exit 1
fi

# Aggregate metrics
echo "$RESPONSE" | jq -r '
    .data.list as $list |
    ($list | map(.metrics.spend | tonumber) | add // 0) as $spend |
    ($list | map(.metrics.impressions | tonumber) | add // 0) as $impressions |
    ($list | map(.metrics.clicks | tonumber) | add // 0) as $clicks |
    ($list | map(.metrics.conversion | tonumber) | add // 0) as $conversions |
    "Impressions:  \($impressions | floor)",
    "Clicks:       \($clicks | floor)",
    "CTR:          \(if $impressions > 0 then ($clicks / $impressions * 100 | . * 100 | floor / 100) else 0 end)%",
    "Spend:        $\($spend | . * 100 | floor / 100)",
    "Conversions:  \($conversions | . * 10 | floor / 10)",
    "CPA:          $\(if $conversions > 0 then ($spend / $conversions | . * 100 | floor / 100) else 0 end)"
' 2>/dev/null || echo "No data available for this period"
