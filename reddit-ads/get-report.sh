#!/bin/bash
# Reddit Ads API - Get Performance Report
# Usage: ./get-report.sh [start_date] [end_date] [granularity]
# Dates in YYYY-MM-DD format
# Granularity: DAY, WEEK, MONTH, TOTAL

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

# Default to last 7 days
END_DATE="${2:-$(date +%Y-%m-%d)}"
START_DATE="${1:-$(date -v-7d +%Y-%m-%d)}"
GRANULARITY="${3:-DAY}"

curl -s -X POST "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/reports" \
  -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"start_date\": \"$START_DATE\",
    \"end_date\": \"$END_DATE\",
    \"granularity\": \"$GRANULARITY\",
    \"metrics\": [
      \"impressions\",
      \"clicks\",
      \"spend_micros\",
      \"ctr\",
      \"cpc_micros\",
      \"cpm_micros\",
      \"video_views\",
      \"video_watched_25_percent\",
      \"video_watched_50_percent\",
      \"video_watched_75_percent\",
      \"video_watched_100_percent\"
    ],
    \"breakdowns\": [\"campaign\"]
  }" | jq .
