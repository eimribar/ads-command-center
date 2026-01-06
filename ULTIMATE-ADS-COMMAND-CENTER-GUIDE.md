# ULTIMATE MULTI-PLATFORM ADS COMMAND CENTER SETUP GUIDE

## THE BULLETPROOF BLUEPRINT

This is the complete, step-by-step guide to building a WORLD-CLASS unified advertising command center that manages Meta (Facebook), Reddit, Google Ads, TikTok, and Google Analytics from a single interface.

**Time to Complete:** 4-8 hours (depending on approval wait times)
**Skill Level:** Intermediate (basic command line + JavaScript knowledge)
**Cost:** Free (just ad platform spend)

---

# TABLE OF CONTENTS

1. [Prerequisites & Overview](#1-prerequisites--overview)
2. [Project Structure Setup](#2-project-structure-setup)
3. [Meta (Facebook) Ads Setup](#3-meta-facebook-ads-setup)
4. [Reddit Ads Setup](#4-reddit-ads-setup)
5. [Google Analytics Setup](#5-google-analytics-setup)
6. [Google Ads Setup](#6-google-ads-setup)
7. [TikTok Ads Setup](#7-tiktok-ads-setup)
8. [Command Center Build](#8-command-center-build)
9. [Testing & Verification](#9-testing--verification)
10. [Maintenance & Token Refresh](#10-maintenance--token-refresh)

---

# 1. PREREQUISITES & OVERVIEW

## 1.1 Required Tools

```bash
# Verify you have these installed:
node --version    # v18+ required
npm --version     # v9+ required
git --version     # Any version
jq --version      # For JSON parsing in scripts
```

Install missing tools:
```bash
# macOS
brew install node jq

# Ubuntu/Debian
sudo apt install nodejs npm jq
```

## 1.2 Required Accounts

You will need accounts on:
- [ ] Meta Business Manager (business.facebook.com)
- [ ] Reddit (with ads access via ads.reddit.com)
- [ ] Google Cloud Console (console.cloud.google.com)
- [ ] Google Ads (ads.google.com)
- [ ] Google Analytics (analytics.google.com)
- [ ] TikTok Business Center (ads.tiktok.com)
- [ ] TikTok Developer Portal (business-api.tiktok.com)

## 1.3 What You'll Build

```
YOUR_PROJECT/
├── .env                      # Master credentials file (NEVER commit!)
├── .gitignore               # Git ignore rules
├── README.md                # Project documentation
├── QUICK-REFERENCE.md       # Quick commands cheat sheet
├── meta ads/                # Meta/Facebook scripts
│   ├── api.sh
│   ├── list-campaigns.sh
│   ├── get-insights.sh
│   ├── get-pixel-stats.sh
│   └── send-conversion.sh
├── reddit-ads/              # Reddit Ads scripts
│   ├── api.sh
│   ├── refresh-token.sh
│   ├── list-campaigns.sh
│   ├── list-ad-groups.sh
│   ├── list-ads.sh
│   ├── list-pixels.sh
│   ├── get-campaign.sh
│   ├── get-report.sh
│   ├── create-campaign.sh
│   ├── update-campaign.sh
│   └── send-conversion.sh
├── google-ads/              # Google Ads scripts
│   ├── SETUP.md
│   ├── api.sh
│   ├── oauth-setup.js
│   ├── list-campaigns.sh
│   ├── get-insights.sh
│   ├── update-campaign.sh
│   └── send-conversion.sh
├── tiktok-ads/              # TikTok Ads scripts
│   ├── SETUP.md
│   ├── api.sh
│   ├── list-campaigns.sh
│   ├── get-insights.sh
│   ├── update-campaign.sh
│   └── send-conversion.sh
├── google-analytics/        # Google Analytics scripts
│   └── (symlink or scripts)
└── command-center/          # Unified Node.js CLI
    ├── package.json
    ├── bin/ads
    └── src/
        ├── index.js
        ├── platforms/
        │   ├── index.js
        │   ├── meta.js
        │   ├── reddit.js
        │   ├── google-ads.js
        │   ├── tiktok.js
        │   └── analytics.js
        ├── commands/
        │   ├── report.js
        │   ├── campaigns.js
        │   ├── conversions.js
        │   └── optimize.js
        └── utils/
            ├── api.js
            └── format.js
```

---

# 2. PROJECT STRUCTURE SETUP

## Step 2.1: Create Project Directory

```bash
# Replace YOUR_PRODUCT with your product name (e.g., "Agentss", "Herolings")
mkdir -p "/Users/$USER/Desktop/YOUR_PRODUCT ads"
cd "/Users/$USER/Desktop/YOUR_PRODUCT ads"
```

## Step 2.2: Create .gitignore

```bash
cat > .gitignore << 'EOF'
# Environment files (CRITICAL - contains secrets!)
.env
*.env
.env.*

# Node modules
node_modules/

# OS files
.DS_Store
Thumbs.db

# IDE files
.idea/
.vscode/
*.swp
*.swo

# Logs
*.log
npm-debug.log*
EOF
```

## Step 2.3: Create Master .env File

```bash
cat > .env << 'EOF'
# ============================================================================
# MASTER CREDENTIALS FILE - YOUR_PRODUCT ADS COMMAND CENTER
# ============================================================================
# NEVER COMMIT THIS FILE TO GIT!
# ============================================================================

# ===== META (FACEBOOK) ADS =====
# Get from: Meta Business Suite > Events Manager > Settings
META_ACCESS_TOKEN=""
META_PIXEL_ID=""
META_AD_ACCOUNT_ID=""
META_SYSTEM_USER_ID=""
META_API_VERSION="v21.0"

# ===== REDDIT ADS =====
# Get from: reddit.com/prefs/apps (create "script" app)
REDDIT_APP_ID=""
REDDIT_SECRET=""
REDDIT_ACCESS_TOKEN=""
REDDIT_REFRESH_TOKEN=""
REDDIT_PROFILE_ID=""
REDDIT_BUSINESS_ID=""
REDDIT_AD_ACCOUNT_ID=""
REDDIT_PIXEL_ID=""
REDDIT_ADS_API="https://ads-api.reddit.com/api/v3"

# ===== GOOGLE ANALYTICS =====
# Get from: Google Cloud Console > APIs & Services > Credentials
GA_CLIENT_ID=""
GA_CLIENT_SECRET=""
GA_ACCESS_TOKEN=""
GA_REFRESH_TOKEN=""
GA_PROPERTY_ID=""
GA_MEASUREMENT_ID=""

# ===== GOOGLE ADS =====
# Get from: Google Ads API Center + Google Cloud Console
GOOGLE_ADS_DEVELOPER_TOKEN=""
GOOGLE_ADS_CLIENT_ID=""
GOOGLE_ADS_CLIENT_SECRET=""
GOOGLE_ADS_REFRESH_TOKEN=""
GOOGLE_ADS_CUSTOMER_ID=""
GOOGLE_ADS_LOGIN_CUSTOMER_ID=""

# ===== TIKTOK ADS =====
# Get from: TikTok Developer Portal + Ads Manager
TIKTOK_APP_ID=""
TIKTOK_SECRET=""
TIKTOK_ACCESS_TOKEN=""
TIKTOK_ADVERTISER_ID=""
TIKTOK_PIXEL_ID=""
TIKTOK_API_BASE="https://business-api.tiktok.com/open_api/v1.3"

# ===== INTERNAL TRAFFIC EXCLUSION =====
INTERNAL_IP=""
EOF
```

## Step 2.4: Create Platform Folders

```bash
mkdir -p "meta ads" reddit-ads google-ads tiktok-ads command-center/src/{platforms,commands,utils} command-center/bin
```

---

# 3. META (FACEBOOK) ADS SETUP

## Step 3.1: Create Meta Business Account

1. Go to https://business.facebook.com
2. Click "Create Account" or use existing
3. Add your business details

## Step 3.2: Create Ad Account

1. In Business Manager, go to Business Settings
2. Click "Ad Accounts" → "Add" → "Create a New Ad Account"
3. Name it (e.g., "YOUR_PRODUCT Ads")
4. Note the Ad Account ID (format: `act_XXXXXXXXXX`)

## Step 3.3: Create Facebook Pixel

1. Go to Events Manager (business.facebook.com/events_manager)
2. Click "Connect Data Sources" → "Web"
3. Name your pixel (e.g., "YOUR_PRODUCT Pixel")
4. Note the Pixel ID (16-digit number)

## Step 3.4: Create System User for API Access

1. In Business Manager → Business Settings → Users → System Users
2. Click "Add" → Create new system user
3. Name: "CAPI_Server" or similar
4. Role: Admin
5. Click "Generate New Token"
6. Select your Ad Account
7. Required Permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
8. Copy the access token (VERY LONG string)

## Step 3.5: Update .env with Meta Credentials

```bash
# Edit .env and fill in:
META_ACCESS_TOKEN="EAAMcHKYbz3w..."  # The long token from Step 3.4
META_PIXEL_ID="1234567890123456"     # From Step 3.3
META_AD_ACCOUNT_ID="act_123456789"   # From Step 3.2 (include "act_" prefix!)
META_SYSTEM_USER_ID="122104747695182090"  # From System User page
META_API_VERSION="v21.0"
```

## Step 3.6: Create Meta Scripts

### meta ads/api.sh
```bash
cat > "meta ads/api.sh" << 'EOF'
#!/bin/bash
# Meta Graph API Helper

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

API_VERSION="${META_API_VERSION:-v21.0}"
BASE_URL="https://graph.facebook.com/${API_VERSION}"

METHOD="${1:-GET}"
ENDPOINT="$2"
DATA="$3"

if [[ -z "$META_ACCESS_TOKEN" ]]; then
    echo "Error: META_ACCESS_TOKEN not set"
    exit 1
fi

if [[ -z "$ENDPOINT" ]]; then
    echo "Usage: $0 <METHOD> <ENDPOINT> [JSON_DATA]"
    exit 1
fi

if [[ "$METHOD" == "GET" ]]; then
    curl -s "${BASE_URL}${ENDPOINT}&access_token=${META_ACCESS_TOKEN}" | jq .
else
    curl -s -X POST "${BASE_URL}${ENDPOINT}" \
        -H "Content-Type: application/json" \
        -d "{\"access_token\":\"${META_ACCESS_TOKEN}\",${DATA:1:-1}}" | jq .
fi
EOF
chmod +x "meta ads/api.sh"
```

### meta ads/list-campaigns.sh
```bash
cat > "meta ads/list-campaigns.sh" << 'EOF'
#!/bin/bash
# List Meta Ad Campaigns

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

API_VERSION="${META_API_VERSION:-v21.0}"

if [[ -z "$META_ACCESS_TOKEN" || -z "$META_AD_ACCOUNT_ID" ]]; then
    echo "Error: META_ACCESS_TOKEN and META_AD_ACCOUNT_ID must be set"
    exit 1
fi

echo "=== Meta Ad Campaigns ==="
echo ""

curl -s "https://graph.facebook.com/${API_VERSION}/${META_AD_ACCOUNT_ID}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time&access_token=${META_ACCESS_TOKEN}" | jq -r '
    .data[]? |
    "ID: \(.id)
Name: \(.name)
Status: \(.status)
Objective: \(.objective)
Daily Budget: \(.daily_budget // "N/A")
Created: \(.created_time)
---"
'
EOF
chmod +x "meta ads/list-campaigns.sh"
```

### meta ads/get-insights.sh
```bash
cat > "meta ads/get-insights.sh" << 'EOF'
#!/bin/bash
# Get Meta Ads Performance Insights

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

API_VERSION="${META_API_VERSION:-v21.0}"
DATE_PRESET="${1:-yesterday}"

if [[ -z "$META_ACCESS_TOKEN" || -z "$META_AD_ACCOUNT_ID" ]]; then
    echo "Error: META_ACCESS_TOKEN and META_AD_ACCOUNT_ID must be set"
    exit 1
fi

echo "=== Meta Ads Performance ($DATE_PRESET) ==="
echo ""

RESPONSE=$(curl -s "https://graph.facebook.com/${API_VERSION}/${META_AD_ACCOUNT_ID}/insights?fields=impressions,clicks,spend,reach,cpc,cpm,ctr,actions&date_preset=${DATE_PRESET}&access_token=${META_ACCESS_TOKEN}")

echo "$RESPONSE" | jq -r '
    .data[0]? // {} |
    "Impressions: \(.impressions // 0)
Clicks:      \(.clicks // 0)
CTR:         \(.ctr // 0)%
Spend:       $\(.spend // 0)
Reach:       \(.reach // 0)
CPC:         $\(.cpc // 0)
CPM:         $\(.cpm // 0)"
'
EOF
chmod +x "meta ads/get-insights.sh"
```

### meta ads/get-pixel-stats.sh
```bash
cat > "meta ads/get-pixel-stats.sh" << 'EOF'
#!/bin/bash
# Get Meta Pixel Statistics

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

API_VERSION="${META_API_VERSION:-v21.0}"

if [[ -z "$META_ACCESS_TOKEN" || -z "$META_PIXEL_ID" ]]; then
    echo "Error: META_ACCESS_TOKEN and META_PIXEL_ID must be set"
    exit 1
fi

echo "=== Meta Pixel Stats (Last 7 Days) ==="
echo ""

curl -s "https://graph.facebook.com/${API_VERSION}/${META_PIXEL_ID}/stats?aggregation=event&access_token=${META_ACCESS_TOKEN}" | jq .
EOF
chmod +x "meta ads/get-pixel-stats.sh"
```

### meta ads/send-conversion.sh
```bash
cat > "meta ads/send-conversion.sh" << 'EOF'
#!/bin/bash
# Send Conversion Event via Meta Conversions API (CAPI)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

API_VERSION="${META_API_VERSION:-v21.0}"

# Parse arguments
EVENT_NAME="${1:-Purchase}"
EMAIL="$2"
ORDER_ID="$3"
VALUE="$4"
CURRENCY="${5:-USD}"

if [[ -z "$META_ACCESS_TOKEN" || -z "$META_PIXEL_ID" ]]; then
    echo "Error: META_ACCESS_TOKEN and META_PIXEL_ID must be set"
    exit 1
fi

# Generate event ID for deduplication
EVENT_ID="evt_$(date +%s)_$(openssl rand -hex 4)"
EVENT_TIME=$(date +%s)

echo "=== Sending Conversion to Meta ==="
echo "Event: $EVENT_NAME"
echo "Event ID: $EVENT_ID"
[[ -n "$EMAIL" ]] && echo "Email: $EMAIL (will be hashed)"
[[ -n "$VALUE" ]] && echo "Value: $VALUE $CURRENCY"
echo ""

# Hash email if provided
HASHED_EMAIL=""
if [[ -n "$EMAIL" ]]; then
    HASHED_EMAIL=$(echo -n "${EMAIL,,}" | shasum -a 256 | cut -d' ' -f1)
fi

# Build user_data object
USER_DATA="{}"
if [[ -n "$HASHED_EMAIL" ]]; then
    USER_DATA="{\"em\":[\"$HASHED_EMAIL\"]}"
fi

# Build custom_data object
CUSTOM_DATA="{}"
if [[ -n "$VALUE" ]]; then
    CUSTOM_DATA="{\"currency\":\"$CURRENCY\",\"value\":$VALUE"
    if [[ -n "$ORDER_ID" ]]; then
        CUSTOM_DATA="$CUSTOM_DATA,\"order_id\":\"$ORDER_ID\""
    fi
    CUSTOM_DATA="$CUSTOM_DATA}"
fi

# Build request
REQUEST_BODY=$(cat <<EOFBODY
{
    "data": [{
        "event_name": "$EVENT_NAME",
        "event_time": $EVENT_TIME,
        "event_id": "$EVENT_ID",
        "action_source": "website",
        "user_data": $USER_DATA,
        "custom_data": $CUSTOM_DATA
    }]
}
EOFBODY
)

# Send event
RESPONSE=$(curl -s -X POST \
    "https://graph.facebook.com/${API_VERSION}/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_BODY")

# Check response
EVENTS_RECEIVED=$(echo "$RESPONSE" | jq -r '.events_received // 0')
if [[ "$EVENTS_RECEIVED" -gt 0 ]]; then
    echo "Success! Events received: $EVENTS_RECEIVED"
else
    echo "Error: $RESPONSE"
fi
EOF
chmod +x "meta ads/send-conversion.sh"
```

## Step 3.7: Test Meta Integration

```bash
# Test listing campaigns
./meta\ ads/list-campaigns.sh

# Test getting insights
./meta\ ads/get-insights.sh yesterday

# Test pixel stats
./meta\ ads/get-pixel-stats.sh

# Test sending a conversion (use test email)
./meta\ ads/send-conversion.sh Purchase test@example.com TEST123 9.99
```

---

# 4. REDDIT ADS SETUP

## Overview

Reddit Ads uses **TWO different API versions**:
- **v3 API** (`https://ads-api.reddit.com/api/v3`) - For campaign/ad management
- **v2.0 API** (`https://ads-api.reddit.com/api/v2.0`) - For Conversions API (CAPI)

**Account Hierarchy:**
```
Business (UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
└── Ad Account (a2_xxxxx format)
    ├── Campaigns
    │   └── Ad Groups
    │       └── Ads (linked to Posts)
    └── Pixel (usually same ID as ad account)

Profile (t2_xxxxx format) - Used for creating Posts/Creatives
```

**⚠️ CRITICAL: Token Expiration**
- Access tokens expire in **24 hours** - you MUST refresh daily!
- Refresh tokens last ~7 days of inactivity
- Set up a daily cron job to refresh tokens automatically

---

## Step 4.1: Create Reddit Ads Account

**You need TWO separate things:**
1. A **Reddit Ads account** (for running ads, managing campaigns)
2. A **Reddit Developer App** (for API access)

### 4.1.1: Sign Up for Reddit Ads

1. Go to https://ads.reddit.com
2. Click "Get Started" or "Sign Up"
3. Log in with your existing Reddit account (or create one)
4. Complete the business profile:
   - Business name
   - Business address
   - Industry category
5. Create your first Ad Account (you can have multiple)
6. Add payment method (credit card required to run ads, but not for API testing)

### 4.1.2: Note Your Account Structure

After setup, you'll have:
- **Profile ID** (`t2_xxxxx`) - Your Reddit user profile, used for creating posts
- **Business ID** (UUID format) - Your business entity
- **Ad Account ID** (`a2_xxxxx`) - Where campaigns live
- **Pixel ID** - Usually same as Ad Account ID

---

## Step 4.2: Create Reddit Developer App

This is separate from your Ads account. The Developer App gives you API credentials.

### 4.2.1: Navigate to Reddit Apps

1. Go to https://www.reddit.com/prefs/apps
2. Make sure you're logged in with the SAME Reddit account that owns your Ads account
3. Scroll to the very bottom of the page

### 4.2.2: Create the App

1. Click **"create another app..."** (or "create app" if first time)
2. Fill in the form:

| Field | Value | Notes |
|-------|-------|-------|
| **name** | `YOUR_PRODUCT Ads Manager` | Any descriptive name |
| **App type** | ○ **script** | ⚠️ MUST be "script" for server-side! |
| **description** | `Internal ads management tool` | Optional |
| **about url** | (leave blank) | Optional |
| **redirect uri** | `https://www.yoursite.com/callback` | ⚠️ Must match EXACTLY in OAuth flow! |

3. Click **"create app"**

### 4.2.3: Find Your Credentials

After creation, you'll see your app listed. The credentials are:

```
YOUR_PRODUCT Ads Manager
script app                      ← App type
-QRVvUbpickX6qOwx-mxbg         ← THIS IS YOUR APP_ID (under the name!)

description: Internal ads management tool
about url:
redirect uri: https://www.yoursite.com/callback

secret: H3EJGsRaHE0tsh2i1uY4ZAOmA4XLOA   ← THIS IS YOUR SECRET
```

**⚠️ IMPORTANT:** The App ID is the random string UNDER your app name, NOT labeled. It often starts with a dash (`-`).

---

## Step 4.3: Get OAuth Tokens (One-Time Setup)

Reddit requires OAuth 2.0 authentication. You need to authorize once to get a refresh token, then use that to get access tokens.

### Required Scopes

| Scope | Permission |
|-------|------------|
| `adsread` | Read campaigns, ad groups, ads, reports |
| `adswrite` | Create/update campaigns, ad groups, ads |
| `adsconversions` | Send conversion events via CAPI |

### Step 4.3.1: Generate Authorization URL

```bash
# Set your credentials
APP_ID="your_app_id"                              # From Step 4.2.3
REDIRECT_URI="https://www.yoursite.com/callback"  # Must match EXACTLY!
STATE="random_state_$(date +%s)"
SCOPES="adsread,adswrite,adsconversions"

# Generate the URL
AUTH_URL="https://www.reddit.com/api/v1/authorize?client_id=${APP_ID}&response_type=code&state=${STATE}&redirect_uri=${REDIRECT_URI}&duration=permanent&scope=${SCOPES}"

echo "Open this URL in your browser:"
echo "$AUTH_URL"

# Or open directly (macOS)
open "$AUTH_URL"
```

**Key parameters:**
- `duration=permanent` - Gets you a refresh token (lasts 7 days of inactivity)
- `response_type=code` - Authorization code flow
- `scope` - Comma-separated, no spaces

### Step 4.3.2: Authorize and Get Code

1. Open the generated URL in your browser
2. Log in to Reddit if prompted
3. Review the permissions and click **"Allow"**
4. You'll be redirected to your callback URL with parameters:
   ```
   https://www.yoursite.com/callback?state=random_state_1234567890&code=2ck3x2DK-xMxqmLrKTqZXjhc_jPxZA
   ```
5. Copy the `code` value (everything after `code=`)

**⚠️ The code expires in 10 minutes!** Exchange it immediately.

### Step 4.3.3: Exchange Code for Tokens

```bash
APP_ID="your_app_id"
APP_SECRET="your_app_secret"
REDIRECT_URI="https://www.yoursite.com/callback"  # Must match!
CODE="paste_code_from_step_2_here"

# Exchange code for tokens
curl -X POST "https://www.reddit.com/api/v1/access_token" \
    -u "$APP_ID:$APP_SECRET" \
    -A "YourApp/1.0" \
    -d "grant_type=authorization_code&code=$CODE&redirect_uri=$REDIRECT_URI"
```

**Successful Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1Njpz...",
  "token_type": "bearer",
  "expires_in": 86400,
  "refresh_token": "827032427930-UWv8DSCBeVfjhZOxJD3ucKQvrOmv_A",
  "scope": "adsconversions adsread adswrite"
}
```

### Step 4.3.4: OAuth Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_grant` | Code expired or already used | Generate new auth URL, get fresh code |
| `unauthorized_client` | Wrong App ID or Secret | Check credentials from Step 4.2.3 |
| `invalid_request` | Redirect URI mismatch | URI must match app settings EXACTLY |
| `access_denied` | User denied authorization | Click "Allow" on auth page |
| No refresh_token | Missing `duration=permanent` | Regenerate auth URL with `duration=permanent` |

**⚠️ SAVE BOTH TOKENS IMMEDIATELY!**
- `access_token` - Expires in 24 hours, used for API calls
- `refresh_token` - Lasts 7 days of inactivity, used to get new access tokens

---

## Step 4.4: Get Account IDs

After getting your access token, retrieve your account IDs:

```bash
ACCESS_TOKEN="your_access_token"

# Get Profile ID (needed for creating posts)
echo "=== PROFILE ==="
curl -s "https://ads-api.reddit.com/api/v3/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.data | {id, name}'

# Get Business ID
echo "=== BUSINESSES ==="
curl -s "https://ads-api.reddit.com/api/v3/businesses" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.data[] | {id, name}'

# Get Ad Account ID (use your BUSINESS_ID from above)
BUSINESS_ID="your-business-uuid"
echo "=== AD ACCOUNTS ==="
curl -s "https://ads-api.reddit.com/api/v3/businesses/$BUSINESS_ID/ad_accounts" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.data[] | {id, name}'

# Get Profile ID for post creation (alternative method)
AD_ACCOUNT_ID="a2_xxxxx"
echo "=== PROFILES (for posts) ==="
curl -s "https://ads-api.reddit.com/api/v3/ad_accounts/$AD_ACCOUNT_ID/profiles" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.data[] | {id, name}'
```

---

## Step 4.5: Update .env with Reddit Credentials

```bash
# Edit .env and fill in ALL values:
REDDIT_APP_ID="-QRVvUbpickX6qOwx-mxbg"           # From Step 4.2
REDDIT_SECRET="H3EJGsRaHE0tsh2i1uY4ZAOmA4XLOA"  # From Step 4.2
REDDIT_ACCESS_TOKEN="eyJhbGciOiJSUzI1NiIs..."    # From Step 4.3 (expires in 24h!)
REDDIT_REFRESH_TOKEN="827032427930-UWv8DS..."    # From Step 4.3 (long-lived)
REDDIT_PROFILE_ID="t2_ajxlr5i2"                  # From Step 4.4
REDDIT_BUSINESS_ID="9ed0f11d-cc74-493c-88f3-4556ce79cafb"  # From Step 4.4
REDDIT_AD_ACCOUNT_ID="a2_gu5cal6xbcpp"           # From Step 4.4
REDDIT_PIXEL_ID="a2_gu5cal6xbcpp"                # Usually same as ad account ID
REDDIT_ADS_API="https://ads-api.reddit.com/api/v3"
```

---

## Step 4.6: Create Reddit Scripts

### reddit-ads/.env (Local credentials)
Create a local .env in the reddit-ads folder that sources the main one or has its own credentials:
```bash
# Reddit Ads Credentials
REDDIT_APP_ID="-QRVvUbpickX6qOwx-mxbg"
REDDIT_SECRET="your_secret"
REDDIT_ACCESS_TOKEN="your_token"
REDDIT_REFRESH_TOKEN="your_refresh_token"
REDDIT_PROFILE_ID="t2_xxxxx"
REDDIT_BUSINESS_ID="uuid-here"
REDDIT_AD_ACCOUNT_ID="a2_xxxxx"
REDDIT_PIXEL_ID="a2_xxxxx"
REDDIT_ADS_API="https://ads-api.reddit.com/api/v3"
```

### reddit-ads/refresh-token.sh (RUN DAILY!)
```bash
cat > reddit-ads/refresh-token.sh << 'EOF'
#!/bin/bash
# Refresh Reddit OAuth Token - RUN THIS DAILY!
# Access tokens expire every 24 hours

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env" 2>/dev/null || source "$SCRIPT_DIR/../.env" 2>/dev/null

if [[ -z "$REDDIT_APP_ID" || -z "$REDDIT_SECRET" || -z "$REDDIT_REFRESH_TOKEN" ]]; then
    echo "Error: REDDIT_APP_ID, REDDIT_SECRET, and REDDIT_REFRESH_TOKEN must be set"
    exit 1
fi

echo "Refreshing Reddit access token..."

RESPONSE=$(curl -s -X POST "https://www.reddit.com/api/v1/access_token" \
    -u "$REDDIT_APP_ID:$REDDIT_SECRET" \
    -A "YourApp/1.0" \
    -d "grant_type=refresh_token&refresh_token=$REDDIT_REFRESH_TOKEN")

NEW_ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')
NEW_REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token // empty')

if [[ -n "$NEW_ACCESS_TOKEN" && "$NEW_ACCESS_TOKEN" != "null" ]]; then
    echo "✅ Token refreshed successfully!"
    echo ""
    echo "Update your .env with:"
    echo "REDDIT_ACCESS_TOKEN=\"$NEW_ACCESS_TOKEN\""
    [[ -n "$NEW_REFRESH_TOKEN" ]] && echo "REDDIT_REFRESH_TOKEN=\"$NEW_REFRESH_TOKEN\""
else
    echo "❌ Error refreshing token:"
    echo "$RESPONSE" | jq .
    exit 1
fi
EOF
chmod +x reddit-ads/refresh-token.sh
```

### reddit-ads/api.sh
```bash
cat > reddit-ads/api.sh << 'EOF'
#!/bin/bash
# Reddit Ads API Helper
# Usage: ./api.sh GET /me
# Usage: ./api.sh POST /ad_accounts/a2_xxx/campaigns '{"data":{...}}'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env" 2>/dev/null || source "$SCRIPT_DIR/../.env" 2>/dev/null

METHOD="${1:-GET}"
ENDPOINT="$2"
DATA="$3"

if [[ -z "$REDDIT_ACCESS_TOKEN" ]]; then
    echo "Error: REDDIT_ACCESS_TOKEN not set. Run refresh-token.sh first."
    exit 1
fi

if [[ -z "$ENDPOINT" ]]; then
    echo "Usage: ./api.sh <METHOD> <ENDPOINT> [JSON_DATA]"
    echo "Example: ./api.sh GET /me"
    echo "Example: ./api.sh GET /ad_accounts/$REDDIT_AD_ACCOUNT_ID/campaigns"
    exit 1
fi

if [[ "$METHOD" == "GET" ]]; then
    curl -s "${REDDIT_ADS_API}${ENDPOINT}" \
        -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq .
else
    curl -s -X "$METHOD" "${REDDIT_ADS_API}${ENDPOINT}" \
        -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$DATA" | jq .
fi
EOF
chmod +x reddit-ads/api.sh
```

### reddit-ads/create-campaign.sh
```bash
cat > reddit-ads/create-campaign.sh << 'EOF'
#!/bin/bash
# Create Reddit Campaign
# Usage: ./create-campaign.sh <name> [objective]
# Objectives: AWARENESS, CONSIDERATION, CONVERSIONS, VIDEO_VIEWS, APP_INSTALLS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env" 2>/dev/null || source "$SCRIPT_DIR/../.env" 2>/dev/null

NAME="$1"
OBJECTIVE="${2:-CONVERSIONS}"

if [[ -z "$NAME" ]]; then
    echo "Usage: ./create-campaign.sh <name> [objective]"
    echo "Objectives: AWARENESS, CONSIDERATION, CONVERSIONS, VIDEO_VIEWS, APP_INSTALLS"
    exit 1
fi

echo "Creating campaign: $NAME (Objective: $OBJECTIVE)"

# IMPORTANT: Must wrap in "data": {} object!
curl -s -X POST "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/campaigns" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"data\": {
            \"name\": \"$NAME\",
            \"objective\": \"$OBJECTIVE\",
            \"configured_status\": \"PAUSED\"
        }
    }" | jq .
EOF
chmod +x reddit-ads/create-campaign.sh
```

### reddit-ads/create-ad-group.sh (CRITICAL - All Required Fields for Conversion Campaigns!)
```bash
cat > reddit-ads/create-ad-group.sh << 'EOF'
#!/bin/bash
# Create Reddit Ad Group for CONVERSIONS campaigns
# Usage: ./create-ad-group.sh <campaign_id> <name> [optimization_goal] [geo]
#
# IMPORTANT: For CONVERSIONS campaigns, ALL these fields are REQUIRED:
# - bid_strategy, bid_type, bid_value, goal_value
# - optimization_goal, view_through_conversion_type
# - start_time, targeting

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env" 2>/dev/null || source "$SCRIPT_DIR/../.env" 2>/dev/null

CAMPAIGN_ID="$1"
NAME="$2"
OPT_GOAL="${3:-LEAD}"      # LEAD, PAGE_VISIT, PURCHASE, SIGN_UP, ADD_TO_CART
GEO="${4:-US}"

if [[ -z "$CAMPAIGN_ID" || -z "$NAME" ]]; then
    echo "Usage: ./create-ad-group.sh <campaign_id> <name> [optimization_goal] [geo]"
    echo ""
    echo "Optimization Goals: LEAD, PAGE_VISIT, PURCHASE, SIGN_UP, ADD_TO_CART"
    echo "Example: ./create-ad-group.sh 2404462911986962808 'US Leads' LEAD US"
    exit 1
fi

START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Creating ad group: $NAME"
echo "  Campaign: $CAMPAIGN_ID"
echo "  Optimization: $OPT_GOAL"
echo "  Geo: $GEO"
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
EOF
chmod +x reddit-ads/create-ad-group.sh
```

**Required Ad Group Fields for Conversion Campaigns:**

| Field | Description | Values |
|-------|-------------|--------|
| `bid_strategy` | Bidding approach | `MAXIMIZE_VOLUME`, `MANUAL_BIDDING`, `TARGET_CPX` |
| `bid_type` | Bid metric | `CPC`, `CPM`, `CPV` |
| `bid_value` | Bid amount in micros | 500000 = $0.50 |
| `goal_value` | Daily budget in micros (min $5) | 5000000 = $5.00 |
| `optimization_goal` | Conversion type | `LEAD`, `PAGE_VISIT`, `PURCHASE`, `SIGN_UP`, `ADD_TO_CART` |
| `view_through_conversion_type` | Attribution window | `SEVEN_DAY_CLICKS`, `SEVEN_DAY_CLICKS_ONE_DAY_VIEW` |
| `start_time` | ISO 8601 datetime | `2025-01-01T00:00:00Z` |
| `targeting.geolocations` | Countries | `["US", "CA", "GB"]` |

### reddit-ads/create-post.sh (CRITICAL - Creatives via Profiles Endpoint!)
```bash
cat > reddit-ads/create-post.sh << 'EOF'
#!/bin/bash
# Create Reddit Post (Creative) for Ads
# Usage: ./create-post.sh <headline> <destination_url> [image_url] [cta]
#
# IMPORTANT: Posts are created via /profiles/{profile_id}/posts endpoint!
# For CONVERSION campaigns, you MUST use IMAGE/VIDEO type with destination_url.
# TEXT posts CANNOT be used for conversion campaigns!

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env" 2>/dev/null || source "$SCRIPT_DIR/../.env" 2>/dev/null

HEADLINE="$1"
DESTINATION_URL="$2"
IMAGE_URL="${3:-https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200}"
CTA="${4:-Learn More}"

if [[ -z "$HEADLINE" || -z "$DESTINATION_URL" ]]; then
    echo "Usage: ./create-post.sh <headline> <destination_url> [image_url] [cta]"
    echo ""
    echo "CTA Options: 'Learn More', 'Sign Up', 'Shop Now', 'Book Now', 'Contact Us',"
    echo "            'Get a Quote', 'Download', 'Install', 'Apply Now', 'Order Now'"
    echo ""
    echo "Example: ./create-post.sh 'Try AI Automation' 'https://www.agentss.ai' '' 'Learn More'"
    exit 1
fi

# Extract display URL
DISPLAY_URL=$(echo "$DESTINATION_URL" | sed -e 's|https://||' -e 's|http://||' -e 's|www\.||' -e 's|/.*||')

echo "Creating post via /profiles/$REDDIT_PROFILE_ID/posts"
echo "  Headline: $HEADLINE"
echo "  Destination: $DESTINATION_URL"
echo "  CTA: $CTA"
echo ""

# IMPORTANT: Use /profiles/{profile_id}/posts endpoint, NOT /posts!
curl -s -X POST "$REDDIT_ADS_API/profiles/$REDDIT_PROFILE_ID/posts" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"data\": {
            \"headline\": \"$HEADLINE\",
            \"type\": \"IMAGE\",
            \"allow_comments\": false,
            \"content\": [{
                \"destination_url\": \"$DESTINATION_URL\",
                \"display_url\": \"$DISPLAY_URL\",
                \"call_to_action\": \"$CTA\",
                \"media_url\": \"$IMAGE_URL\"
            }]
        }
    }" | jq .
EOF
chmod +x reddit-ads/create-post.sh
```

### reddit-ads/create-ad.sh
```bash
cat > reddit-ads/create-ad.sh << 'EOF'
#!/bin/bash
# Create Reddit Ad (links Post to Ad Group)
# Usage: ./create-ad.sh <ad_group_id> <post_id> <name>
#
# NOTE: Do NOT include click_url - it comes from the post's destination_url

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env" 2>/dev/null || source "$SCRIPT_DIR/../.env" 2>/dev/null

AD_GROUP_ID="$1"
POST_ID="$2"
NAME="$3"

if [[ -z "$AD_GROUP_ID" || -z "$POST_ID" || -z "$NAME" ]]; then
    echo "Usage: ./create-ad.sh <ad_group_id> <post_id> <name>"
    echo ""
    echo "Example: ./create-ad.sh 2404466433148818222 t3_1q07hsy 'Lead Ad v1'"
    exit 1
fi

echo "Creating ad: $NAME"
echo "  Ad Group: $AD_GROUP_ID"
echo "  Post: $POST_ID"
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
EOF
chmod +x reddit-ads/create-ad.sh
```

### reddit-ads/send-conversion.sh (IMPORTANT: Uses v2.0 API!)
```bash
cat > reddit-ads/send-conversion.sh << 'EOF'
#!/bin/bash
# Send Conversion Event to Reddit CAPI
# IMPORTANT: Uses v2.0 API, NOT v3!
#
# Usage: ./send-conversion.sh <event_type> [email] [click_id] [value] [currency]
# Event Types: PageVisit, ViewContent, Search, AddToCart, AddToWishlist,
#              Purchase, Lead, SignUp, Custom

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env" 2>/dev/null || source "$SCRIPT_DIR/../.env" 2>/dev/null

EVENT_TYPE="${1:-Lead}"
EMAIL="$2"
CLICK_ID="$3"
VALUE="$4"
CURRENCY="${5:-USD}"

if [[ -z "$REDDIT_ACCESS_TOKEN" || -z "$REDDIT_AD_ACCOUNT_ID" ]]; then
    echo "Error: REDDIT_ACCESS_TOKEN and REDDIT_AD_ACCOUNT_ID must be set"
    exit 1
fi

EVENT_ID="evt_$(date +%s)_$(openssl rand -hex 4)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "=== Sending Conversion to Reddit CAPI (v2.0) ==="
echo "Event: $EVENT_TYPE"
echo "Event ID: $EVENT_ID"
[[ -n "$EMAIL" ]] && echo "Email: $EMAIL (will be hashed)"
[[ -n "$VALUE" ]] && echo "Value: $VALUE $CURRENCY"
echo ""

# Hash email if provided (lowercase, trimmed, SHA-256)
HASHED_EMAIL=""
if [[ -n "$EMAIL" ]]; then
    HASHED_EMAIL=$(echo -n "${EMAIL,,}" | shasum -a 256 | cut -d' ' -f1)
fi

# Build user object
USER_OBJ="{}"
[[ -n "$HASHED_EMAIL" ]] && USER_OBJ="{\"email\":\"$HASHED_EMAIL\"}"
[[ -n "$CLICK_ID" ]] && USER_OBJ=$(echo "$USER_OBJ" | jq ". + {\"click_id\":\"$CLICK_ID\"}")

# Build metadata
METADATA="{\"conversion_id\":\"$EVENT_ID\",\"item_count\":1"
[[ -n "$VALUE" ]] && METADATA="$METADATA,\"value_decimal\":$VALUE,\"currency\":\"$CURRENCY\""
METADATA="$METADATA}"

# IMPORTANT: Use v2.0 endpoint for CAPI, not v3!
RESPONSE=$(curl -s -X POST "https://ads-api.reddit.com/api/v2.0/conversions/events/$REDDIT_AD_ACCOUNT_ID" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"test_mode\": false,
        \"events\": [{
            \"event_at\": \"$TIMESTAMP\",
            \"event_type\": {\"tracking_type\": \"$EVENT_TYPE\"},
            \"user\": $USER_OBJ,
            \"event_metadata\": $METADATA
        }]
    }")

echo "$RESPONSE" | jq -r '.message // .'
EOF
chmod +x reddit-ads/send-conversion.sh
```

### reddit-ads/verify-all.sh (Complete System Verification)
```bash
cat > reddit-ads/verify-all.sh << 'EOF'
#!/bin/bash
# Reddit Ads - Complete System Verification

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env" 2>/dev/null || source "$SCRIPT_DIR/../.env" 2>/dev/null

echo "=============================================="
echo "REDDIT ADS - COMPLETE VERIFICATION"
echo "=============================================="

# Refresh token first
echo ""
echo "=== REFRESHING TOKEN ==="
NEW_TOKEN=$(curl -s -X POST "https://www.reddit.com/api/v1/access_token" \
    -u "$REDDIT_APP_ID:$REDDIT_SECRET" \
    -A "App/1.0" \
    -d "grant_type=refresh_token&refresh_token=$REDDIT_REFRESH_TOKEN" | jq -r '.access_token')

if [[ -n "$NEW_TOKEN" && "$NEW_TOKEN" != "null" ]]; then
    echo "✅ Token refreshed"
    export REDDIT_ACCESS_TOKEN="$NEW_TOKEN"
else
    echo "⚠️  Using existing token"
fi

echo ""
echo "=== ACCOUNT INFO ==="
curl -s "$REDDIT_ADS_API/me" -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" | \
    jq -r '.data | "Profile: \(.id)"'

echo ""
echo "=== CAMPAIGNS ==="
curl -s "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/campaigns" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" | \
    jq -r '.data[] | "  [\(.effective_status)] \(.name)"'

echo ""
echo "=== AD GROUPS ==="
curl -s "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/ad_groups" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" | \
    jq -r '.data[] | "  [\(.effective_status)] \(.name)"'

echo ""
echo "=== ADS ==="
curl -s "$REDDIT_ADS_API/ad_accounts/$REDDIT_AD_ACCOUNT_ID/ads" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" | \
    jq -r '.data[] | "  [\(.effective_status)] \(.name)"'

echo ""
echo "=== CONVERSION TEST (CAPI v2.0) ==="
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
HASHED_EMAIL=$(echo -n "test@example.com" | shasum -a 256 | cut -d' ' -f1)
curl -s -X POST "https://ads-api.reddit.com/api/v2.0/conversions/events/$REDDIT_AD_ACCOUNT_ID" \
    -H "Authorization: Bearer $REDDIT_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"test_mode\": false,
        \"events\": [{
            \"event_at\": \"$TIMESTAMP\",
            \"event_type\": {\"tracking_type\": \"Lead\"},
            \"user\": {\"email\": \"$HASHED_EMAIL\"},
            \"event_metadata\": {\"conversion_id\": \"verify_$(date +%s)\", \"item_count\": 1}
        }]
    }" | jq -r '.message // .'

echo ""
echo "=============================================="
echo "✅ ALL SYSTEMS OPERATIONAL!"
echo "=============================================="
EOF
chmod +x reddit-ads/verify-all.sh
```

---

## Step 4.7: Complete Ad Creation Flow

Here's the complete flow to create a working ad:

```bash
cd reddit-ads

# 1. Refresh token (do this daily!)
./refresh-token.sh

# 2. Create Campaign (CONVERSIONS objective)
./create-campaign.sh "My Conversion Campaign" CONVERSIONS
# Note the campaign ID from response (e.g., 2404462911986962808)

# 3. Create Ad Group (with ALL required fields!)
./create-ad-group.sh 2404462911986962808 "US Leads" LEAD US
# Note the ad_group_id from response (e.g., 2404466433148818222)

# 4. Create Post (IMAGE type with destination_url for conversions!)
./create-post.sh "Try AI Automation Today" "https://www.yoursite.com" "" "Learn More"
# Note the post ID from response (e.g., t3_1q07hsy)

# 5. Create Ad (links post to ad group)
./create-ad.sh 2404466433148818222 t3_1q07hsy "Lead Ad v1"

# 6. Verify everything
./verify-all.sh
```

---

## Step 4.8: Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `bid_strategy is required` | Missing field | Add `bid_strategy`: MAXIMIZE_VOLUME, MANUAL_BIDDING, or TARGET_CPX |
| `bid_type is required` | Missing field | Add `bid_type`: CPC, CPM, or CPV |
| `goal_value must be at least $5.00` | Value too low | Set `goal_value` >= 5000000 (micros) |
| `optimization_goal not supported` | Wrong value | Use: LEAD, PAGE_VISIT, PURCHASE, SIGN_UP, ADD_TO_CART |
| `view_through_conversion_type invalid` | Wrong value | Use: SEVEN_DAY_CLICKS or SEVEN_DAY_CLICKS_ONE_DAY_VIEW |
| `post_id is invalid` | Wrong post type | For conversions, use IMAGE post with destination_url |
| `Free form ads cannot have click url` | Passed click_url | Remove click_url; use post's destination_url instead |
| `Posts for Conversion campaigns cannot be free-form` | TEXT post | Create IMAGE/VIDEO post with destination_url |
| 404 on `/api/v3/posts` | Wrong endpoint | Use `/api/v3/profiles/{profile_id}/posts` |
| `call_to_action 'LEARN_MORE' invalid` | Wrong format | Use title case with space: "Learn More" |
| `{"data": null}` response | Wrong body format | Wrap payload in `{"data": {...}}` |

---

## Step 4.9: Test Reddit Integration

```bash
# Verify everything is working
./reddit-ads/verify-all.sh

# Expected output:
# ==============================================
# REDDIT ADS - COMPLETE VERIFICATION
# ==============================================
# ✅ Token refreshed
# Profile: t2_xxxxx
# Campaigns listed
# Ad Groups listed
# Ads listed
# Successfully processed 1 conversion events.
# ==============================================
# ✅ ALL SYSTEMS OPERATIONAL!
# ==============================================
```

---

# 5. GOOGLE ANALYTICS SETUP

## Step 5.1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Name it (e.g., "YOUR_PRODUCT Analytics")

## Step 5.2: Enable APIs

1. Go to APIs & Services → Library
2. Search and enable:
   - "Google Analytics Data API"
   - "Google Analytics Admin API"

## Step 5.3: Create OAuth Credentials

1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Desktop app"
4. Name: "YOUR_PRODUCT Analytics Client"
5. Download the JSON file
6. Note the Client ID and Client Secret

## Step 5.4: Get OAuth Tokens

```bash
# Use the OAuth Playground for initial setup:
# 1. Go to https://developers.google.com/oauthplayground/
# 2. Click gear icon → Check "Use your own OAuth credentials"
# 3. Enter your Client ID and Client Secret
# 4. In Step 1, select: "Google Analytics Data API v1beta"
# 5. Click Authorize APIs and login
# 6. Click Exchange authorization code for tokens
# 7. Copy the Refresh Token and Access Token
```

## Step 5.5: Get Property ID

1. Go to https://analytics.google.com
2. Select your property
3. Admin → Property Settings
4. Note the Property ID (9-digit number)

## Step 5.6: Update .env

```bash
GA_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GA_CLIENT_SECRET="GOCSPX-xxxxx"
GA_ACCESS_TOKEN="ya29.xxxxx"           # Expires in 1 hour
GA_REFRESH_TOKEN="1//xxxxx"            # Long-lived
GA_PROPERTY_ID="123456789"
GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

---

# 6. GOOGLE ADS SETUP

## Step 6.1: Create Google Ads Account

1. Go to https://ads.google.com
2. Create account or use existing
3. Note your Customer ID (10-digit number, format: XXX-XXX-XXXX)

## Step 6.2: Create Manager Account (MCC)

1. Go to https://ads.google.com/home/tools/manager-accounts/
2. Create Manager Account
3. Link your regular ad account to it
4. Note the Manager Account ID

## Step 6.3: Apply for Developer Token

1. In Manager Account, go to Tools & Settings → API Center
2. Apply for Basic Access (immediate) or Standard Access (review)
3. Note your Developer Token

**IMPORTANT:** Basic Access only allows test accounts. Standard Access (1-2 weeks review) is needed for production.

## Step 6.4: Create OAuth Credentials (or Reuse from GA)

You can reuse the same Google Cloud project OAuth credentials from Google Analytics.

## Step 6.5: Get OAuth Tokens for Google Ads

```bash
# Create oauth-setup.js in google-ads folder:
cat > google-ads/oauth-setup.js << 'EOF'
// Google Ads OAuth Setup Helper
import { createServer } from 'http';
import { URL } from 'url';
import open from 'open';

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:8080/callback';

const SCOPES = [
    'https://www.googleapis.com/auth/adwords'
].join(' ');

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;

console.log('Opening browser for Google Ads authorization...');
console.log('Auth URL:', authUrl);

const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');

        if (code) {
            // Exchange code for tokens
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    redirect_uri: REDIRECT_URI,
                    grant_type: 'authorization_code'
                })
            });

            const tokens = await tokenResponse.json();

            console.log('\n=== TOKENS OBTAINED ===\n');
            console.log('Add these to your .env file:\n');
            console.log(`GOOGLE_ADS_REFRESH_TOKEN="${tokens.refresh_token}"`);
            console.log(`GOOGLE_ADS_ACCESS_TOKEN="${tokens.access_token}"`);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Success!</h1><p>Check your terminal for tokens. You can close this window.</p>');

            setTimeout(() => process.exit(0), 1000);
        }
    }
});

server.listen(8080, () => {
    console.log('Waiting for OAuth callback on http://localhost:8080/callback');
    open(authUrl);
});
EOF
```

Run it:
```bash
cd google-ads
npm init -y
npm install open
node oauth-setup.js
```

## Step 6.6: Update .env

```bash
GOOGLE_ADS_DEVELOPER_TOKEN="-rvsYVdc5oemjnbiTT4h5w"
GOOGLE_ADS_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_ADS_CLIENT_SECRET="GOCSPX-xxxxx"
GOOGLE_ADS_REFRESH_TOKEN="1//xxxxx"
GOOGLE_ADS_CUSTOMER_ID="1234567890"      # Without dashes
GOOGLE_ADS_LOGIN_CUSTOMER_ID="9876543210" # Manager account, without dashes
```

## Step 6.7: Create Google Ads Scripts

### google-ads/api.sh
```bash
cat > google-ads/api.sh << 'EOF'
#!/bin/bash
# Google Ads API Helper (uses GAQL queries)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

QUERY="$1"

if [[ -z "$GOOGLE_ADS_DEVELOPER_TOKEN" || -z "$GOOGLE_ADS_CUSTOMER_ID" ]]; then
    echo "Error: Google Ads credentials not set"
    exit 1
fi

# Refresh access token
ACCESS_TOKEN=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
    -d "client_id=$GOOGLE_ADS_CLIENT_ID" \
    -d "client_secret=$GOOGLE_ADS_CLIENT_SECRET" \
    -d "refresh_token=$GOOGLE_ADS_REFRESH_TOKEN" \
    -d "grant_type=refresh_token" | jq -r '.access_token')

# Execute GAQL query
curl -s -X POST \
    "https://googleads.googleapis.com/v18/customers/${GOOGLE_ADS_CUSTOMER_ID}/googleAds:searchStream" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "developer-token: $GOOGLE_ADS_DEVELOPER_TOKEN" \
    -H "login-customer-id: $GOOGLE_ADS_LOGIN_CUSTOMER_ID" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUERY\"}" | jq .
EOF
chmod +x google-ads/api.sh
```

### google-ads/list-campaigns.sh
```bash
cat > google-ads/list-campaigns.sh << 'EOF'
#!/bin/bash
# List Google Ads Campaigns

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

QUERY="SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign_budget.amount_micros FROM campaign ORDER BY campaign.id"

"$SCRIPT_DIR/api.sh" "$QUERY"
EOF
chmod +x google-ads/list-campaigns.sh
```

### google-ads/send-conversion.sh
```bash
cat > google-ads/send-conversion.sh << 'EOF'
#!/bin/bash
# Upload Offline Conversion to Google Ads

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Parse arguments
GCLID=""
ACTION=""
VALUE=""
CURRENCY="USD"

while [[ $# -gt 0 ]]; do
    case $1 in
        --gclid) GCLID="$2"; shift 2 ;;
        --action) ACTION="$2"; shift 2 ;;
        --value) VALUE="$2"; shift 2 ;;
        --currency) CURRENCY="$2"; shift 2 ;;
        *) shift ;;
    esac
done

if [[ -z "$GCLID" || -z "$ACTION" ]]; then
    echo "Usage: $0 --gclid <GCLID> --action <ACTION> [--value <VALUE>]"
    exit 1
fi

echo "=== Uploading Conversion to Google Ads ==="
echo "GCLID: $GCLID"
echo "Action: $ACTION"
[[ -n "$VALUE" ]] && echo "Value: $VALUE $CURRENCY"
echo ""

# Get fresh access token
ACCESS_TOKEN=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
    -d "client_id=$GOOGLE_ADS_CLIENT_ID" \
    -d "client_secret=$GOOGLE_ADS_CLIENT_SECRET" \
    -d "refresh_token=$GOOGLE_ADS_REFRESH_TOKEN" \
    -d "grant_type=refresh_token" | jq -r '.access_token')

# Format conversion time
CONVERSION_TIME=$(date -u +"%Y-%m-%d %H:%M:%S+00:00")

# Build conversion object
CONVERSION="{
    \"gclid\": \"$GCLID\",
    \"conversionAction\": \"customers/$GOOGLE_ADS_CUSTOMER_ID/conversionActions/$ACTION\",
    \"conversionDateTime\": \"$CONVERSION_TIME\""

if [[ -n "$VALUE" ]]; then
    CONVERSION="$CONVERSION,
    \"conversionValue\": $VALUE,
    \"currencyCode\": \"$CURRENCY\""
fi

CONVERSION="$CONVERSION
}"

# Upload conversion
RESPONSE=$(curl -s -X POST \
    "https://googleads.googleapis.com/v18/customers/${GOOGLE_ADS_CUSTOMER_ID}:uploadClickConversions" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "developer-token: $GOOGLE_ADS_DEVELOPER_TOKEN" \
    -H "login-customer-id: $GOOGLE_ADS_LOGIN_CUSTOMER_ID" \
    -H "Content-Type: application/json" \
    -d "{\"conversions\": [$CONVERSION], \"partialFailure\": true}")

echo "$RESPONSE" | jq .
EOF
chmod +x google-ads/send-conversion.sh
```

---

# 7. TIKTOK ADS SETUP

## Step 7.1: Create TikTok Business Account

1. Go to https://ads.tiktok.com
2. Create Business Center account
3. Complete business verification
4. Create an Ad Account
5. Note the Advertiser ID

## Step 7.2: Create TikTok Pixel (Events API)

This gives you conversion tracking WITHOUT needing Marketing API approval:

1. In TikTok Ads Manager, go to Assets → Events
2. Click "Set Up Web Events" → "Events API"
3. Create a new pixel
4. Enable "Automatic Advanced Matching" (AAM)
5. Generate Access Token
6. Note the Pixel ID and Access Token

## Step 7.3: Apply for Marketing API (Optional but Recommended)

For full campaign management:

1. Go to https://business-api.tiktok.com/portal/apply
2. Complete developer profile
3. Fill in application:
   - **App Name:** "YOUR_PRODUCT Ads Manager"
   - **Description:** "Internal tool for managing TikTok ad campaigns, monitoring performance metrics, and optimizing ad spend for YOUR_PRODUCT. Includes campaign creation, budget management, and reporting capabilities."
   - **Redirect URL:** `https://yourproduct.com/auth/tiktok/callback`
4. Select permissions:
   - Ad Account Management
   - Ads Management
   - Audience Management
   - Reporting
   - Measurement
   - Pixel Management
5. Submit and wait 1-3 business days

## Step 7.4: Update .env

```bash
TIKTOK_APP_ID="awvw5py1uud1lzij"        # From Marketing API (if approved)
TIKTOK_SECRET="uImneTkH..."             # From Marketing API (if approved)
TIKTOK_ACCESS_TOKEN="50b8d347e6..."     # From Events Manager
TIKTOK_ADVERTISER_ID="7589650024145944593"
TIKTOK_PIXEL_ID="D59U0LBC77U84I7BRHQG"
TIKTOK_API_BASE="https://business-api.tiktok.com/open_api/v1.3"
```

## Step 7.5: Create TikTok Scripts

### tiktok-ads/api.sh
```bash
cat > tiktok-ads/api.sh << 'EOF'
#!/bin/bash
# TikTok Ads API Helper

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

ENDPOINT="$1"
METHOD="${2:-GET}"
DATA="$3"

API_BASE="${TIKTOK_API_BASE:-https://business-api.tiktok.com/open_api/v1.3}"

if [[ -z "$TIKTOK_ACCESS_TOKEN" ]]; then
    echo "Error: TIKTOK_ACCESS_TOKEN not set"
    exit 1
fi

if [[ "$METHOD" == "GET" ]]; then
    curl -s "${API_BASE}${ENDPOINT}" \
        -H "Access-Token: $TIKTOK_ACCESS_TOKEN" \
        -H "Content-Type: application/json" | jq .
else
    curl -s -X POST "${API_BASE}${ENDPOINT}" \
        -H "Access-Token: $TIKTOK_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$DATA" | jq .
fi
EOF
chmod +x tiktok-ads/api.sh
```

### tiktok-ads/list-campaigns.sh
```bash
cat > tiktok-ads/list-campaigns.sh << 'EOF'
#!/bin/bash
# List TikTok Campaigns

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

API_BASE="${TIKTOK_API_BASE:-https://business-api.tiktok.com/open_api/v1.3}"

if [[ -z "$TIKTOK_ACCESS_TOKEN" || -z "$TIKTOK_ADVERTISER_ID" ]]; then
    echo "Error: TIKTOK_ACCESS_TOKEN and TIKTOK_ADVERTISER_ID must be set"
    exit 1
fi

echo "=== TikTok Campaigns ==="
echo ""

curl -s "${API_BASE}/campaign/get/?advertiser_id=${TIKTOK_ADVERTISER_ID}" \
    -H "Access-Token: $TIKTOK_ACCESS_TOKEN" | jq -r '
    .data.list[]? |
    "ID: \(.campaign_id)
Name: \(.campaign_name)
Status: \(.operation_status // .primary_status)
Objective: \(.objective_type)
Budget: \(.budget // "N/A")
---"
'
EOF
chmod +x tiktok-ads/list-campaigns.sh
```

### tiktok-ads/send-conversion.sh
```bash
cat > tiktok-ads/send-conversion.sh << 'EOF'
#!/bin/bash
# Send Conversion to TikTok Events API

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Parse arguments
EVENT=""
EMAIL=""
PHONE=""
VALUE=""
CURRENCY="USD"
URL=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --event) EVENT="$2"; shift 2 ;;
        --email) EMAIL="$2"; shift 2 ;;
        --phone) PHONE="$2"; shift 2 ;;
        --value) VALUE="$2"; shift 2 ;;
        --currency) CURRENCY="$2"; shift 2 ;;
        --url) URL="$2"; shift 2 ;;
        *) shift ;;
    esac
done

if [[ -z "$EVENT" ]]; then
    echo "Usage: $0 --event <EVENT> [--email <EMAIL>] [--value <VALUE>]"
    echo ""
    echo "Events: CompletePayment, AddToCart, ViewContent, SubmitForm, Registration, Search"
    exit 1
fi

if [[ -z "$TIKTOK_ACCESS_TOKEN" || -z "$TIKTOK_PIXEL_ID" ]]; then
    echo "Error: TIKTOK_ACCESS_TOKEN and TIKTOK_PIXEL_ID must be set"
    exit 1
fi

API_BASE="${TIKTOK_API_BASE:-https://business-api.tiktok.com/open_api/v1.3}"

# Generate event ID
EVENT_ID="evt_$(date +%s)_$(openssl rand -hex 4)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "=== Sending Conversion to TikTok ==="
echo "Event: $EVENT"
echo "Event ID: $EVENT_ID"
[[ -n "$EMAIL" ]] && echo "Email: $EMAIL (will be hashed)"
[[ -n "$VALUE" ]] && echo "Value: $VALUE $CURRENCY"
echo ""

# Hash email if provided
HASHED_EMAIL=""
if [[ -n "$EMAIL" ]]; then
    HASHED_EMAIL=$(echo -n "${EMAIL,,}" | shasum -a 256 | cut -d' ' -f1)
fi

# Hash phone if provided
HASHED_PHONE=""
if [[ -n "$PHONE" ]]; then
    HASHED_PHONE=$(echo -n "$PHONE" | shasum -a 256 | cut -d' ' -f1)
fi

# Build user context
USER_CONTEXT=""
if [[ -n "$HASHED_EMAIL" ]]; then
    USER_CONTEXT="\"email\":\"$HASHED_EMAIL\""
fi
if [[ -n "$HASHED_PHONE" ]]; then
    [[ -n "$USER_CONTEXT" ]] && USER_CONTEXT="$USER_CONTEXT,"
    USER_CONTEXT="$USER_CONTEXT\"phone_number\":\"$HASHED_PHONE\""
fi

# Build properties
PROPERTIES=""
if [[ -n "$VALUE" ]]; then
    PROPERTIES="\"currency\":\"$CURRENCY\",\"value\":$VALUE"
fi

# Build page context
PAGE_URL="${URL:-https://yourproduct.com}"

# Build request body
REQUEST_BODY=$(cat <<EOFBODY
{
    "pixel_code": "$TIKTOK_PIXEL_ID",
    "event": "$EVENT",
    "event_id": "$EVENT_ID",
    "timestamp": "$TIMESTAMP",
    "context": {
        "user": {${USER_CONTEXT}},
        "page": {"url": "$PAGE_URL"}
    },
    "properties": {${PROPERTIES}}
}
EOFBODY
)

# Send event
RESPONSE=$(curl -s -X POST "${API_BASE}/pixel/track/" \
    -H "Access-Token: $TIKTOK_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_BODY")

# Check response
CODE=$(echo "$RESPONSE" | jq -r '.code')
if [[ "$CODE" == "0" ]]; then
    echo "Conversion sent successfully!"
else
    echo "Error: $(echo "$RESPONSE" | jq -r '.message')"
    echo "$RESPONSE" | jq .
fi
EOF
chmod +x tiktok-ads/send-conversion.sh
```

### tiktok-ads/get-insights.sh
```bash
cat > tiktok-ads/get-insights.sh << 'EOF'
#!/bin/bash
# Get TikTok Ads Performance Insights

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

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

if [[ -z "$TIKTOK_ACCESS_TOKEN" ]]; then
    echo "Error: TIKTOK_ACCESS_TOKEN not set"
    exit 1
fi

echo "=== TikTok Ads Performance ($START_DATE to $END_DATE) ==="
echo ""

RESPONSE=$(curl -s -X GET \
    "${API_BASE}/report/integrated/get/?advertiser_id=${TIKTOK_ADVERTISER_ID}&report_type=BASIC&dimensions=%5B%22stat_time_day%22%5D&data_level=AUCTION_ADVERTISER&start_date=${START_DATE}&end_date=${END_DATE}&metrics=%5B%22spend%22%2C%22impressions%22%2C%22clicks%22%2C%22ctr%22%2C%22conversion%22%2C%22cost_per_conversion%22%5D" \
    -H "Access-Token: $TIKTOK_ACCESS_TOKEN")

CODE=$(echo "$RESPONSE" | jq -r '.code')
if [[ "$CODE" != "0" ]]; then
    echo "Error: $(echo "$RESPONSE" | jq -r '.message')"
    exit 1
fi

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
EOF
chmod +x tiktok-ads/get-insights.sh
```

### tiktok-ads/update-campaign.sh
```bash
cat > tiktok-ads/update-campaign.sh << 'EOF'
#!/bin/bash
# Update TikTok Campaign Status

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

API_BASE="${TIKTOK_API_BASE:-https://business-api.tiktok.com/open_api/v1.3}"

# Parse arguments
CAMPAIGN_ID=""
ACTION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --id) CAMPAIGN_ID="$2"; shift 2 ;;
        --action) ACTION="$2"; shift 2 ;;
        *) shift ;;
    esac
done

if [[ -z "$CAMPAIGN_ID" || -z "$ACTION" ]]; then
    echo "Usage: $0 --id <CAMPAIGN_ID> --action <pause|resume>"
    exit 1
fi

case $ACTION in
    pause) STATUS="DISABLE" ;;
    resume) STATUS="ENABLE" ;;
    *) echo "Invalid action: $ACTION (use 'pause' or 'resume')"; exit 1 ;;
esac

if [[ -z "$TIKTOK_ACCESS_TOKEN" ]]; then
    echo "Error: TIKTOK_ACCESS_TOKEN not set"
    exit 1
fi

echo "=== Updating TikTok Campaign $CAMPAIGN_ID ==="
echo "Action: $ACTION -> Status: $STATUS"
echo ""

REQUEST_BODY=$(cat <<EOFBODY
{
    "advertiser_id": "$TIKTOK_ADVERTISER_ID",
    "campaign_ids": ["$CAMPAIGN_ID"],
    "operation_status": "$STATUS"
}
EOFBODY
)

RESPONSE=$(curl -s -X POST "${API_BASE}/campaign/update/status/" \
    -H "Access-Token: $TIKTOK_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_BODY")

CODE=$(echo "$RESPONSE" | jq -r '.code')
if [[ "$CODE" == "0" ]]; then
    echo "Campaign updated successfully!"
else
    echo "Error: $(echo "$RESPONSE" | jq -r '.message')"
fi
EOF
chmod +x tiktok-ads/update-campaign.sh
```

---

# 8. COMMAND CENTER BUILD

## Step 8.1: Initialize Node.js Project

```bash
cd command-center
npm init -y
```

## Step 8.2: Update package.json

```bash
cat > package.json << 'EOF'
{
  "name": "your-product-ads-command-center",
  "version": "1.0.0",
  "description": "Unified multi-platform ads management CLI",
  "type": "module",
  "main": "src/index.js",
  "bin": {
    "ads": "./bin/ads"
  },
  "scripts": {
    "start": "node src/index.js",
    "report": "node src/index.js report",
    "campaigns": "node src/index.js campaigns",
    "convert": "node src/index.js convert",
    "optimize": "node src/index.js optimize"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "chalk": "^5.3.0",
    "cli-table3": "^0.6.3",
    "commander": "^11.1.0",
    "dotenv": "^16.3.1",
    "inquirer": "^9.2.12",
    "ora": "^8.0.1"
  }
}
EOF

npm install
```

## Step 8.3: Create CLI Entry Point

```bash
cat > bin/ads << 'EOF'
#!/usr/bin/env node

/**
 * YOUR_PRODUCT Ads Command Center CLI
 *
 * Install globally with: npm link
 */

import '../src/index.js';
EOF
chmod +x bin/ads
```

## Step 8.4: Create Main CLI (src/index.js)

Create the main CLI file with interactive menu and all commands. (See detailed implementation in the exploration results above)

## Step 8.5: Create Platform Adapters

Create adapters for each platform in `src/platforms/`:
- `meta.js` - Meta/Facebook API integration
- `reddit.js` - Reddit Ads API integration
- `google-ads.js` - Google Ads API integration
- `tiktok.js` - TikTok Marketing/Events API integration
- `analytics.js` - Google Analytics Data API integration
- `index.js` - Platform registry and status checker

## Step 8.6: Create Commands

Create command files in `src/commands/`:
- `report.js` - Cross-platform reporting
- `campaigns.js` - Campaign management
- `conversions.js` - Multi-platform CAPI sender
- `optimize.js` - Budget optimization recommendations

## Step 8.7: Create Utilities

Create utility files in `src/utils/`:
- `api.js` - HTTP client, hashing, date utilities
- `format.js` - Table formatting, colors, display helpers

## Step 8.8: Install Globally (Optional)

```bash
cd command-center
npm link

# Now you can use 'ads' command from anywhere:
ads status
ads report
ads convert Purchase --email test@test.com --value 49.99
```

---

# 9. TESTING & VERIFICATION

## Step 9.1: Test All Platform Connections

```bash
cd "/Users/$USER/Desktop/YOUR_PRODUCT ads/command-center"
node src/index.js status
```

Expected output:
```
Platform Status:
✅ Meta (Facebook) - Configured
✅ Reddit - Configured
✅ Google Analytics - Configured
✅ Google Ads - Configured
✅ TikTok - Configured

5/5 platforms connected
```

## Step 9.2: Test Each Platform Individually

```bash
# Meta
./meta\ ads/list-campaigns.sh
./meta\ ads/send-conversion.sh Purchase test@test.com TEST001 9.99

# Reddit
./reddit-ads/list-campaigns.sh
./reddit-ads/send-conversion.sh Purchase test@test.com

# Google Ads
./google-ads/list-campaigns.sh

# TikTok
./tiktok-ads/list-campaigns.sh
./tiktok-ads/send-conversion.sh --event CompletePayment --email test@test.com --value 9.99
```

## Step 9.3: Test Unified Commands

```bash
# Cross-platform report
node src/index.js report --period last_7d

# Send conversion to ALL platforms
node src/index.js convert Purchase --email customer@email.com --value 49.99

# Get optimization recommendations
node src/index.js optimize
```

---

# 10. MAINTENANCE & TOKEN REFRESH

## Token Expiration Schedule

| Platform | Token Type | Expiration | Action |
|----------|-----------|------------|--------|
| Meta | System User Token | Never* | No action needed |
| Reddit | Access Token | 24 hours | Run refresh-token.sh daily |
| Reddit | Refresh Token | 7 days | Re-authorize if expired |
| Google | Access Token | 1 hour | Auto-refreshed by scripts |
| Google | Refresh Token | 7 days (inactive) | Re-authorize if expired |
| TikTok | Events API Token | ~1 year | Regenerate annually |
| TikTok | Marketing API Token | ~1 year | OAuth refresh if needed |

## Daily Maintenance Script

```bash
cat > maintenance.sh << 'EOF'
#!/bin/bash
# Daily maintenance script - run via cron

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Daily Maintenance $(date) ==="

# Refresh Reddit token
echo "Refreshing Reddit token..."
./reddit-ads/refresh-token.sh

# Test platform connections
echo "Testing platform connections..."
cd command-center && node src/index.js status

echo "=== Maintenance complete ==="
EOF
chmod +x maintenance.sh
```

Add to crontab:
```bash
# Run daily at 6 AM
0 6 * * * /path/to/YOUR_PRODUCT\ ads/maintenance.sh >> /path/to/logs/maintenance.log 2>&1
```

---

# QUICK REFERENCE COMMANDS

```bash
# === COMMAND CENTER ===
ads status                    # Show platform status
ads report                    # Last 7 days report
ads report --period today     # Today's report
ads campaigns                 # List all campaigns
ads convert Purchase --email user@email.com --value 49.99
ads optimize                  # Get recommendations

# === INDIVIDUAL PLATFORMS ===
# Meta
./meta\ ads/list-campaigns.sh
./meta\ ads/get-insights.sh yesterday
./meta\ ads/send-conversion.sh Purchase user@email.com ORDER123 49.99

# Reddit
./reddit-ads/refresh-token.sh      # Run daily!
./reddit-ads/list-campaigns.sh
./reddit-ads/send-conversion.sh Purchase user@email.com

# Google Ads
./google-ads/list-campaigns.sh
./google-ads/get-insights.sh --days 7
./google-ads/send-conversion.sh --gclid GCLID_HERE --action Purchase --value 49.99

# TikTok
./tiktok-ads/list-campaigns.sh
./tiktok-ads/get-insights.sh --days 7
./tiktok-ads/send-conversion.sh --event CompletePayment --email user@email.com --value 49.99
```

---

# TROUBLESHOOTING

## Common Issues

### "Token expired" errors
- **Reddit:** Run `./reddit-ads/refresh-token.sh`
- **Google:** Scripts auto-refresh, but if persistent, re-run OAuth setup
- **TikTok Events API:** Regenerate token in Events Manager

### "Permission denied" errors
- Check that scripts are executable: `chmod +x scriptname.sh`
- Verify API scopes/permissions in platform dashboards

### "Rate limit exceeded"
- Wait and retry (usually 1-5 minutes)
- Implement exponential backoff for automation

### Platform showing "Not Configured"
- Check `.env` file has all required variables
- Variables are properly quoted (no spaces around `=`)
- Source the .env: `source .env && echo $META_ACCESS_TOKEN`

---

# NEXT STEPS: ADAPTING FOR AGENTSS

To set this up for Agentss:

1. Copy the entire folder structure
2. Rename `YOUR_PRODUCT` everywhere
3. Create new accounts on each platform for `YOUR_PRODUCT`
4. Get new credentials (follow each platform section)
5. Update `.env` with Agentss credentials
6. Update URLs in scripts
7. Test each platform

The infrastructure is identical - only the credentials and product references change!

---

**END OF GUIDE**

*This guide was created based on the complete Ads Command Center implementation (2025-12-30)*
