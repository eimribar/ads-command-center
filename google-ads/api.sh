#!/bin/bash

# ============================================================================
# Google Ads API Helper
# ============================================================================
# Usage: ./api.sh <query>
# Example: ./api.sh "SELECT campaign.id, campaign.name FROM campaign LIMIT 10"
# ============================================================================

set -e

# Load credentials
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Configuration
DEVELOPER_TOKEN="${GOOGLE_ADS_DEVELOPER_TOKEN}"
CLIENT_ID="${GOOGLE_ADS_CLIENT_ID}"
CLIENT_SECRET="${GOOGLE_ADS_CLIENT_SECRET}"
REFRESH_TOKEN="${GOOGLE_ADS_REFRESH_TOKEN}"
CUSTOMER_ID="${GOOGLE_ADS_CUSTOMER_ID}"
LOGIN_CUSTOMER_ID="${GOOGLE_ADS_LOGIN_CUSTOMER_ID}"
API_VERSION="v18"

# Validate required credentials
if [[ -z "$DEVELOPER_TOKEN" || -z "$CLIENT_ID" || -z "$REFRESH_TOKEN" || -z "$CUSTOMER_ID" ]]; then
    echo "❌ Error: Missing Google Ads credentials in .env file"
    echo "Required: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID"
    exit 1
fi

# Get fresh access token
get_access_token() {
    local response=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
        -d "refresh_token=$REFRESH_TOKEN" \
        -d "client_id=$CLIENT_ID" \
        -d "client_secret=$CLIENT_SECRET" \
        -d "grant_type=refresh_token")

    echo "$response" | jq -r '.access_token'
}

# Execute GAQL query
execute_query() {
    local query="$1"
    local access_token=$(get_access_token)

    if [[ -z "$access_token" || "$access_token" == "null" ]]; then
        echo "❌ Error: Failed to get access token"
        exit 1
    fi

    local headers=(-H "Authorization: Bearer $access_token")
    headers+=(-H "developer-token: $DEVELOPER_TOKEN")
    headers+=(-H "Content-Type: application/json")

    if [[ -n "$LOGIN_CUSTOMER_ID" ]]; then
        headers+=(-H "login-customer-id: $LOGIN_CUSTOMER_ID")
    fi

    curl -s -X POST \
        "https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER_ID}/googleAds:searchStream" \
        "${headers[@]}" \
        -d "{\"query\": \"$query\"}"
}

# Main
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <GAQL query>"
    echo "Example: $0 \"SELECT campaign.id, campaign.name FROM campaign LIMIT 10\""
    exit 1
fi

execute_query "$1"
