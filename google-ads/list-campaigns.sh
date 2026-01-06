#!/bin/bash

# ============================================================================
# List Google Ads Campaigns
# ============================================================================
# Usage: ./list-campaigns.sh [--status active|paused|all]
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Parse arguments
STATUS_FILTER=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --status)
            case $2 in
                active) STATUS_FILTER="WHERE campaign.status = 'ENABLED'" ;;
                paused) STATUS_FILTER="WHERE campaign.status = 'PAUSED'" ;;
                all) STATUS_FILTER="" ;;
                *) echo "Invalid status: $2"; exit 1 ;;
            esac
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

QUERY="SELECT
    campaign.id,
    campaign.name,
    campaign.status,
    campaign.advertising_channel_type,
    campaign_budget.amount_micros
FROM campaign
$STATUS_FILTER
ORDER BY campaign.name"

echo "=== Google Ads Campaigns ==="
echo ""

"$SCRIPT_DIR/api.sh" "$QUERY" | jq -r '
    .[].results[]? |
    "\(.campaign.status | if . == "ENABLED" then "🟢" elif . == "PAUSED" then "⏸️ " else "⚪" end) \(.campaign.name) (ID: \(.campaign.id)) - Budget: $\((.campaignBudget.amountMicros // 0) / 1000000)/day"
' 2>/dev/null || echo "❌ Failed to fetch campaigns (API token may be pending approval)"
