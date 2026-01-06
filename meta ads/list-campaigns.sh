#!/bin/bash
# List Meta (Facebook) Ad Campaigns
# Usage: ./list-campaigns.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env"

echo "=== Meta Ad Campaigns ==="

curl -s "https://graph.facebook.com/${META_API_VERSION}/${META_AD_ACCOUNT_ID}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time&access_token=${META_ACCESS_TOKEN}" | jq .
