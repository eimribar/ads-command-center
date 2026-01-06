#!/bin/bash
# Get Meta Ads Performance Insights
# Usage: ./get-insights.sh [date_preset]
# Date presets: today, yesterday, last_7d, last_30d, this_month, last_month

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env"

DATE_PRESET="${1:-yesterday}"

echo "=== Meta Ads Insights ($DATE_PRESET) ==="

curl -s "https://graph.facebook.com/${META_API_VERSION}/${META_AD_ACCOUNT_ID}/insights?fields=impressions,clicks,spend,reach,cpc,cpm,ctr,actions,conversions&date_preset=${DATE_PRESET}&access_token=${META_ACCESS_TOKEN}" | jq .
