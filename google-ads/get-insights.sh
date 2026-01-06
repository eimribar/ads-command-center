#!/bin/bash

# ============================================================================
# Get Google Ads Performance Insights
# ============================================================================
# Usage: ./get-insights.sh [--days N]
# Default: Last 7 days
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Parse arguments
DAYS=7
while [[ $# -gt 0 ]]; do
    case $1 in
        --days)
            DAYS=$2
            shift 2
            ;;
        *)
            shift
            ;;
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

QUERY="SELECT
    metrics.impressions,
    metrics.clicks,
    metrics.cost_micros,
    metrics.conversions,
    metrics.conversions_value
FROM customer
WHERE segments.date BETWEEN '$START_DATE' AND '$END_DATE'"

echo "=== Google Ads Performance ($START_DATE to $END_DATE) ==="
echo ""

RESULT=$("$SCRIPT_DIR/api.sh" "$QUERY" 2>/dev/null)

if echo "$RESULT" | jq -e '.[].results' >/dev/null 2>&1; then
    echo "$RESULT" | jq -r '
        [.[].results[].metrics] | add |
        "Impressions:  \(.impressions // 0 | tonumber | floor)",
        "Clicks:       \(.clicks // 0 | tonumber | floor)",
        "CTR:          \(if (.impressions // 0) > 0 then ((.clicks // 0) / (.impressions // 1) * 100 | . * 100 | floor / 100) else 0 end)%",
        "Spend:        $\(((.costMicros // 0) | tonumber) / 1000000 | . * 100 | floor / 100)",
        "Conversions:  \(.conversions // 0 | tonumber | . * 10 | floor / 10)",
        "Conv Value:   $\((.conversionsValue // 0) | tonumber | . * 100 | floor / 100)",
        "CPA:          $\(if (.conversions // 0) > 0 then (((.costMicros // 0) | tonumber) / 1000000 / ((.conversions // 1) | tonumber) | . * 100 | floor / 100) else 0 end)"
    '
else
    echo "❌ Failed to fetch insights"
    echo "$RESULT" | jq -r '.error.message // "API token may be pending approval"' 2>/dev/null || echo "Unknown error"
fi
