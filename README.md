# Agentss Ads & Analytics Documentation

> Complete documentation for Agentss advertising and analytics infrastructure.
> Session Date: 2025-12-30

---

## Table of Contents

1. [Overview](#overview)
2. [Command Center](#command-center)
3. [Reddit Ads API](#reddit-ads-api)
4. [Reddit Pixel Implementation](#reddit-pixel-implementation)
5. [Meta Conversions API](#meta-conversions-api)
6. [Google Analytics Data API](#google-analytics-data-api)
7. [Analytics Events Tracking](#analytics-events-tracking)
8. [Internal Traffic Exclusion](#internal-traffic-exclusion)
9. [Scripts Reference](#scripts-reference)
10. [Quick Commands](#quick-commands)

---

## Overview

### Infrastructure Summary

| Platform | Purpose | Status |
|----------|---------|--------|
| Reddit Ads API | Campaign management, CAPI conversions | ✅ Active |
| Reddit Pixel | Client-side conversion tracking | ✅ Implemented |
| Google Analytics 4 | Website analytics & reporting | ✅ Active |
| GA Data API | Programmatic analytics queries | ✅ Active |
| Meta Pixel | Facebook/Instagram conversion tracking | ✅ Active |
| Meta CAPI | Server-side conversion tracking | ✅ Active |

### File Locations

| Location | Purpose |
|----------|---------|
| `/Users/eimribar/reddit-ads/` | Reddit Ads API scripts |
| `/Users/eimribar/Desktop/Agentss ads/meta ads/` | Meta Conversions API scripts |
| `/Users/eimribar/google-analytics/` | GA Data API scripts |
| `/Users/eimribar/Desktop/Agentss ads/` | Master documentation & credentials |
| `/Users/eimribar/Desktop/Projects/Agentss Minimal/` | Website source code |
| `/Users/eimribar/Desktop/Agentss ads/command-center/` | Unified CLI Command Center |
| `/Users/eimribar/Desktop/Agentss ads/google-ads/` | Google Ads (placeholder - setup required) |
| `/Users/eimribar/Desktop/Agentss ads/tiktok-ads/` | TikTok Ads (placeholder - setup required) |

---

## Command Center

The **Agentss Ads Command Center** is a unified Node.js CLI application that manages all advertising platforms from a single interface.

### Features

- **Cross-Platform Reporting**: View unified performance metrics across Meta, Reddit, Google Ads, and TikTok
- **Campaign Management**: List and manage campaigns from all platforms
- **Multi-Platform Conversions**: Send conversion events to all platforms with a single command
- **Budget Optimization**: AI-powered recommendations for budget allocation

### Installation

The Command Center is already installed. To use it globally:

```bash
cd "/Users/eimribar/Desktop/Agentss ads/command-center"
npm link
```

### Usage

```bash
# Interactive mode (recommended)
ads

# Show platform status
ads status

# Generate cross-platform report
ads report
ads report --period yesterday
ads report --period last_7d
ads report --period last_30d

# List campaigns across all platforms
ads campaigns

# Send conversion to ALL platforms at once
ads convert Purchase --email user@email.com --value 49.99 --order ORDER123
ads convert Lead --email user@email.com
ads convert AddToCart --email user@email.com --value 29.99

# Get budget optimization recommendations
ads optimize
ads optimize --period last_30d
```

### Platform Status

| Platform | Status | Notes |
|----------|--------|-------|
| Meta Ads | ✅ Connected | CAPI + Insights working |
| Reddit Ads | ✅ Connected | CAPI + Campaigns working |
| Google Analytics | ✅ Connected | Events + Traffic reporting |
| Google Ads | ❌ Not configured | See `google-ads/SETUP.md` |
| TikTok Ads | ❌ Not configured | See `tiktok-ads/SETUP.md` |

### Architecture

```
command-center/
├── package.json
├── bin/
│   └── ads                    # Global CLI entry point
└── src/
    ├── index.js               # Main CLI with Commander.js
    ├── platforms/             # Platform adapters
    │   ├── meta.js            # Meta/Facebook API
    │   ├── reddit.js          # Reddit Ads API
    │   ├── analytics.js       # Google Analytics API
    │   ├── google-ads.js      # Google Ads (placeholder)
    │   └── tiktok.js          # TikTok Ads (placeholder)
    ├── commands/
    │   ├── report.js          # Cross-platform reporting
    │   ├── campaigns.js       # Campaign management
    │   ├── conversions.js     # Multi-platform CAPI
    │   └── optimize.js        # Budget optimization
    └── utils/
        ├── api.js             # HTTP client + helpers
        └── format.js          # Table/chart formatting
```

### Adding New Platforms

To add Google Ads or TikTok:
1. Follow the setup guide in `google-ads/SETUP.md` or `tiktok-ads/SETUP.md`
2. Add credentials to `/Users/eimribar/Desktop/Agentss ads/.env`
3. The Command Center will automatically detect and use the new platform

---

## Reddit Ads API

### Authentication Flow Completed

1. **Developer App Created** at https://www.reddit.com/prefs/apps
   - App Type: Web App
   - Redirect URI: `http://localhost:8080`

2. **OAuth2 Scopes Granted:**
   - `adsread` - Read advertising data
   - `adsedit` - Create/edit ads, campaigns, ad groups
   - `adsconversions` - Send conversion events (CAPI)
   - `history` - Access submission history
   - `read` - Read posts/comments

3. **API Hierarchy Discovered:**
   ```
   Profile (t2_ajxlr5i2)
   └── Business (9ed0f11d-cc74-493c-88f3-4556ce79cafb)
       └── Ad Account (a2_gu5cal6xbcpp)
           ├── Campaigns
           ├── Ad Groups
           ├── Ads
           └── Pixel (a2_gu5cal6xbcpp)
   ```

### Credentials

```bash
# App Credentials
REDDIT_APP_ID="cFF_c-ep26c06VBPpV9M-A"
REDDIT_SECRET="oMc_i_aYggRZ0HyavaOZJBXxBZwzow"

# OAuth Tokens
REDDIT_ACCESS_TOKEN="eyJhbGciOiJSUzI1NiIs..." # Expires in 24 hours
REDDIT_REFRESH_TOKEN="827032427930-UWv8DSCBeVfjhZOxJD3ucKQvrOmv_A"

# Account IDs
REDDIT_PROFILE_ID="t2_ajxlr5i2"
REDDIT_BUSINESS_ID="9ed0f11d-cc74-493c-88f3-4556ce79cafb"
REDDIT_AD_ACCOUNT_ID="a2_gu5cal6xbcpp"
REDDIT_PIXEL_ID="a2_gu5cal6xbcpp"
```

### Scripts Created (`/Users/eimribar/reddit-ads/`)

| Script | Purpose | Usage |
|--------|---------|-------|
| `api.sh` | Generic API requests | `./api.sh GET /me` |
| `refresh-token.sh` | Refresh expired access token | `./refresh-token.sh` |
| `list-campaigns.sh` | List all campaigns | `./list-campaigns.sh` |
| `list-ad-groups.sh` | List ad groups for campaign | `./list-ad-groups.sh <campaign_id>` |
| `list-ads.sh` | List ads for ad group | `./list-ads.sh <adgroup_id>` |
| `list-pixels.sh` | List conversion pixels | `./list-pixels.sh` |
| `get-campaign.sh` | Get campaign details | `./get-campaign.sh <campaign_id>` |
| `update-campaign.sh` | Update campaign | `./update-campaign.sh <id> '<json>'` |
| `send-conversion.sh` | Send CAPI event | `./send-conversion.sh Purchase email@example.com` |
| `get-report.sh` | Get performance report | `./get-report.sh` |

### API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v3/me` | GET | Current user profile |
| `/api/v3/businesses/{id}/ad_accounts` | GET | List ad accounts |
| `/api/v3/ad_accounts/{id}/campaigns` | GET/POST | List/Create campaigns |
| `/api/v3/campaigns/{id}` | GET/PATCH | Manage campaign |
| `/api/v3/ad_accounts/{id}/pixels` | GET | List pixels |
| `/api/v3/conversions/events/{pixel_id}` | POST | Send CAPI events |

---

## Reddit Pixel Implementation

### Changes Made to Website

#### 1. `index.html` (lines 76-82)

Added Reddit Pixel script after Meta Pixel:

```html
<!-- Reddit Pixel Code -->
<script>
  !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
  rdt('init','a2_gu5cal6xbcpp');
  rdt('track', 'PageVisit');
</script>
<!-- End Reddit Pixel Code -->
```

Also added DNS prefetch (line 52):
```html
<link rel="dns-prefetch" href="https://www.redditstatic.com">
```

#### 2. `lib/analytics.ts`

Added `trackReddit()` function with event mapping:

```typescript
// Reddit Pixel tracking
export const trackReddit = (eventName: string, data?: EventData) => {
  if (isAnalyticsDisabled()) return;
  if (typeof window !== 'undefined' && window.rdt) {
    const redditEventMap: { [key: string]: string } = {
      'PageView': 'PageVisit',
      'ViewContent': 'ViewContent',
      'AddToCart': 'AddToCart',
      'InitiateCheckout': 'AddToCart',
      'Purchase': 'Purchase',
      'Lead': 'Lead',
      'CompleteRegistration': 'SignUp',
      'Search': 'Search',
    };
    // ... implementation
  }
};
```

Updated `track()` to include Reddit:
```typescript
export const track = (eventName: string, data?: EventData, eventId?: string) => {
  trackMeta(eventName, data, eventId);
  trackGA4(eventName, data);
  trackReddit(eventName, data);
};
```

Added Reddit to e-commerce functions:
- `trackViewContent()` - tracks product views
- `trackAddToCart()` - tracks add to cart
- `trackPurchase()` - tracks conversions with transaction ID

Added `rdt` to Window interface:
```typescript
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    gtag: (...args: unknown[]) => void;
    rdt: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
```

---

## Meta Conversions API

### Authentication

The Meta Conversions API uses a System User token for server-side event tracking. This provides more reliable conversion data than client-side pixel alone.

**System User:** `CAPI_Server` (ID: 122104747695182090)

### Credentials

```bash
# System User Token (long-lived)
META_ACCESS_TOKEN="EAAMcHKYbz3wBQ..." # Truncated for security

# Pixel ID
META_PIXEL_ID="1146945313925793"

# Ad Account
META_AD_ACCOUNT_ID="act_793339687067142"

# API Version
META_API_VERSION="v21.0"
```

### Scripts Created (`/Users/eimribar/Desktop/Agentss ads/meta ads/`)

| Script | Purpose | Usage |
|--------|---------|-------|
| `api.sh` | Generic API requests | `./api.sh GET /me` |
| `send-conversion.sh` | Send CAPI events | `./send-conversion.sh Purchase email 49.99` |
| `list-campaigns.sh` | List ad campaigns | `./list-campaigns.sh` |
| `get-insights.sh` | Get performance data | `./get-insights.sh yesterday` |
| `get-pixel-stats.sh` | Get pixel statistics | `./get-pixel-stats.sh` |

### API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/{pixel_id}/events` | POST | Send conversion events (CAPI) |
| `/{pixel_id}/stats` | GET | Get pixel statistics |
| `/{ad_account_id}/campaigns` | GET | List campaigns |
| `/{ad_account_id}/insights` | GET | Get performance insights |

### CAPI Event Examples

```bash
# PageView event
./send-conversion.sh PageView user@email.com

# Purchase event with order ID and value
./send-conversion.sh Purchase user@email.com ORDER_123 49.99

# AddToCart event
./send-conversion.sh AddToCart user@email.com

# Lead event
./send-conversion.sh Lead user@email.com
```

### Event Payload Structure

```json
{
  "data": [{
    "event_name": "Purchase",
    "event_time": 1767094555,
    "event_id": "Purchase_1767094555_abc123",
    "event_source_url": "https://www.agentss.com",
    "action_source": "website",
    "user_data": {
      "em": ["hashed_email_sha256"],
      "client_user_agent": "Mozilla/5.0..."
    },
    "custom_data": {
      "currency": "USD",
      "value": 49.99,
      "order_id": "ORDER_123"
    }
  }]
}
```

---

## Google Analytics Data API

### Authentication Flow Completed

1. **OAuth Client Created** at Google Cloud Console
   - Project: Agentss (ID: 597114451136)
   - Authorized redirect URI: `http://localhost:8080`
   - Test user added: `eimribar@gmail.com`

2. **APIs Enabled:**
   - Google Analytics Data API

### Credentials

```bash
# OAuth Client (get from Google Cloud Console)
GA_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GA_CLIENT_SECRET="your-client-secret"

# OAuth Tokens
GA_ACCESS_TOKEN="ya29.xxx..." # Expires in 1 hour
GA_REFRESH_TOKEN="1//xxx..."

# Property
GA_PROPERTY_ID="your-property-id"
GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

### Scripts Created (`/Users/eimribar/google-analytics/`)

| Script | Purpose | Usage |
|--------|---------|-------|
| `get-events.sh` | Get events report | `./get-events.sh yesterday yesterday` |
| `refresh-token.sh` | Refresh access token | `./refresh-token.sh` |

### Example Queries

**Get yesterday's events:**
```bash
curl -s -X POST "https://analyticsdata.googleapis.com/v1beta/properties/517403460:runReport" \
  -H "Authorization: Bearer $GA_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dateRanges":[{"startDate":"yesterday","endDate":"yesterday"}],"dimensions":[{"name":"eventName"}],"metrics":[{"name":"eventCount"}],"orderBys":[{"metric":{"metricName":"eventCount"},"desc":true}]}'
```

**Get user metrics:**
```bash
curl -s -X POST "https://analyticsdata.googleapis.com/v1beta/properties/517403460:runReport" \
  -H "Authorization: Bearer $GA_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dateRanges":[{"startDate":"yesterday","endDate":"yesterday"}],"metrics":[{"name":"totalUsers"},{"name":"newUsers"},{"name":"sessions"},{"name":"averageSessionDuration"}]}'
```

**Get events by source/medium:**
```bash
curl -s -X POST "https://analyticsdata.googleapis.com/v1beta/properties/517403460:runReport" \
  -H "Authorization: Bearer $GA_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dateRanges":[{"startDate":"yesterday","endDate":"yesterday"}],"dimensions":[{"name":"sessionSourceMedium"},{"name":"eventName"}],"metrics":[{"name":"eventCount"},{"name":"totalUsers"}]}'
```

---

## Analytics Events Tracking

### Events Tracked Across All Platforms

| Event | Meta Pixel | GA4 | Reddit |
|-------|-----------|-----|--------|
| Page View | `PageView` | (auto) | `PageVisit` |
| View Content | `ViewContent` | `view_item` | `ViewContent` |
| Add to Cart | `AddToCart` | `add_to_cart` | `AddToCart` |
| Remove from Cart | `RemovedFromCart` | `remove_from_cart` | `Custom` |
| View Cart | `ViewCart` | `view_cart` | `Custom` |
| Initiate Checkout | `InitiateCheckout` | `begin_checkout` | `AddToCart` |
| Purchase | `Purchase` | `purchase` | `Purchase` |

### Custom Funnel Events

| Event | Description |
|-------|-------------|
| `StartedPersonalization` | User begins personalization flow |
| `PersonalizationStepComplete` | Completed a step (step_number, step_name) |
| `PhotoUploaded` | Photo uploaded (hero or sender) |
| `PreviewGenerated` | Comic preview generated (success/failed) |

### Engagement Events

| Event | Description |
|-------|-------------|
| `ExitIntentPopup` | Popup shown/copied_code/checkout/dismissed |
| `DiscountApplied` | Discount code used |
| `ClickedCTA` | CTA button clicked (location, text) |

---

## Internal Traffic Exclusion

### Method 1: GA4 IP Filter (Configured)

- **IP Address:** `31.154.22.174`
- **Location:** GA4 Admin → Data Settings → Data Filters
- **Limitation:** Only works on same network, not when traveling

### Method 2: localStorage Flag (Implemented)

Added `isAnalyticsDisabled()` check to all tracking functions in `lib/analytics.ts`:

```typescript
const isAnalyticsDisabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('disable_analytics') === 'true';
};
```

**To disable all tracking (GA4, Meta, Reddit):**
```javascript
// Run in browser console on agentss.com
localStorage.setItem('disable_analytics', 'true')
```

**To re-enable:**
```javascript
localStorage.removeItem('disable_analytics')
```

**Benefits:**
- Works on any network (home, travel, anywhere)
- Blocks all client-side tracking
- Domain-specific (only affects agentss.com)
- Persists across sessions

---

## Scripts Reference

### Reddit Ads Scripts

```bash
# Location: /Users/eimribar/reddit-ads/

# Refresh expired token
./refresh-token.sh

# Generic API call
./api.sh GET /me
./api.sh GET /ad_accounts/a2_gu5cal6xbcpp/campaigns
./api.sh POST /ad_accounts/a2_gu5cal6xbcpp/campaigns '{"name": "Test"}'

# List resources
./list-campaigns.sh
./list-pixels.sh

# Send conversion event
./send-conversion.sh Purchase user@email.com
./send-conversion.sh AddToCart
./send-conversion.sh Lead user@email.com click_id_here
```

### Meta Ads Scripts

```bash
# Location: /Users/eimribar/Desktop/Agentss ads/meta ads/

# Send CAPI conversion events
./send-conversion.sh Purchase user@email.com ORDER_123 49.99
./send-conversion.sh AddToCart user@email.com
./send-conversion.sh ViewContent
./send-conversion.sh Lead user@email.com

# List campaigns
./list-campaigns.sh

# Get performance insights
./get-insights.sh yesterday
./get-insights.sh last_7d
./get-insights.sh last_30d

# Get pixel statistics
./get-pixel-stats.sh
```

### Google Analytics Scripts

```bash
# Location: /Users/eimribar/google-analytics/

# Refresh expired token
./refresh-token.sh

# Get events report
./get-events.sh                      # Yesterday
./get-events.sh 7daysAgo today       # Last 7 days
./get-events.sh 2025-12-01 2025-12-31 # Custom range
```

---

## Quick Commands

### Check Yesterday's Analytics
```bash
source /Users/eimribar/google-analytics/.env
curl -s -X POST "https://analyticsdata.googleapis.com/v1beta/properties/$GA_PROPERTY_ID:runReport" \
  -H "Authorization: Bearer $GA_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dateRanges":[{"startDate":"yesterday","endDate":"yesterday"}],"dimensions":[{"name":"eventName"}],"metrics":[{"name":"eventCount"}],"orderBys":[{"metric":{"metricName":"eventCount"},"desc":true}]}' | jq -r '.rows[] | "\(.dimensionValues[0].value): \(.metricValues[0].value)"'
```

### Refresh Reddit Token
```bash
/Users/eimribar/reddit-ads/refresh-token.sh
```

### Refresh GA Token
```bash
/Users/eimribar/google-analytics/refresh-token.sh
```

### Send Reddit Conversion
```bash
/Users/eimribar/reddit-ads/send-conversion.sh Purchase customer@email.com
```

### Send Meta Conversion
```bash
"/Users/eimribar/Desktop/Agentss ads/meta ads/send-conversion.sh" Purchase customer@email.com ORDER_123 49.99
```

### Get Meta Pixel Stats
```bash
"/Users/eimribar/Desktop/Agentss ads/meta ads/get-pixel-stats.sh"
```

### List Reddit Campaigns
```bash
/Users/eimribar/reddit-ads/list-campaigns.sh
```

---

## Token Expiration Notes

| Platform | Token Type | Expiration | Refresh Script |
|----------|-----------|------------|----------------|
| Reddit | Access Token | 24 hours | `/Users/eimribar/reddit-ads/refresh-token.sh` |
| Reddit | Refresh Token | 7 days | Re-authorize via OAuth |
| Google | Access Token | 1 hour | `/Users/eimribar/google-analytics/refresh-token.sh` |
| Google | Refresh Token | 7 days | Re-authorize via OAuth |

---

## Useful Links

- **Reddit Ads API Docs:** https://ads-api.reddit.com/docs/v3/
- **Reddit Developer Apps:** https://www.reddit.com/prefs/apps
- **Reddit Ads Manager:** https://ads.reddit.com
- **GA4 Admin:** https://analytics.google.com/analytics/web/#/a265488307p517403460/admin
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials
- **GA Data API Schema:** https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
- **Meta Events Manager:** https://business.facebook.com/events_manager
- **Meta CAPI Docs:** https://developers.facebook.com/docs/marketing-api/conversions-api
- **Meta Business Settings:** https://business.facebook.com/settings

---

## Session Summary (2025-12-30)

### Completed Tasks

1. ✅ Set up Reddit Ads API access with OAuth2 authentication
2. ✅ Created Reddit Ads management scripts (campaigns, ads, pixels, CAPI)
3. ✅ Implemented Reddit Pixel in Agentss website (index.html + analytics.ts)
4. ✅ Set up Google Analytics Data API access with OAuth2
5. ✅ Created GA4 query scripts for events and user metrics
6. ✅ Queried yesterday's analytics (7 users, 1 purchase, full funnel analysis)
7. ✅ Analyzed user journeys by source/medium
8. ✅ Implemented internal traffic exclusion via localStorage flag
9. ✅ Created comprehensive documentation
10. ✅ Set up Meta Conversions API with System User token
11. ✅ Created Meta CAPI scripts (send-conversion, get-insights, get-pixel-stats)
12. ✅ Tested Meta CAPI events (PageView, Purchase) - working correctly
13. ✅ Built **Agentss Ads Command Center** - unified CLI for all platforms
14. ✅ Created platform adapters for Meta, Reddit, Google Analytics
15. ✅ Created placeholder setup guides for Google Ads and TikTok
16. ✅ Implemented cross-platform reporting, campaign management, and CAPI
17. ✅ Implemented budget optimization recommendations engine

### Files Modified

- `/Users/eimribar/Desktop/Projects/Agentss Minimal/index.html` - Added Reddit Pixel
- `/Users/eimribar/Desktop/Projects/Agentss Minimal/lib/analytics.ts` - Added trackReddit(), isAnalyticsDisabled()

### Files Created

- `/Users/eimribar/reddit-ads/.env`
- `/Users/eimribar/reddit-ads/api.sh`
- `/Users/eimribar/reddit-ads/refresh-token.sh`
- `/Users/eimribar/reddit-ads/list-campaigns.sh`
- `/Users/eimribar/reddit-ads/list-ad-groups.sh`
- `/Users/eimribar/reddit-ads/list-ads.sh`
- `/Users/eimribar/reddit-ads/list-pixels.sh`
- `/Users/eimribar/reddit-ads/get-campaign.sh`
- `/Users/eimribar/reddit-ads/update-campaign.sh`
- `/Users/eimribar/reddit-ads/send-conversion.sh`
- `/Users/eimribar/reddit-ads/get-report.sh`
- `/Users/eimribar/google-analytics/.env`
- `/Users/eimribar/google-analytics/get-events.sh`
- `/Users/eimribar/google-analytics/refresh-token.sh`
- `/Users/eimribar/Desktop/Agentss ads/meta ads/.env`
- `/Users/eimribar/Desktop/Agentss ads/meta ads/api.sh`
- `/Users/eimribar/Desktop/Agentss ads/meta ads/send-conversion.sh`
- `/Users/eimribar/Desktop/Agentss ads/meta ads/list-campaigns.sh`
- `/Users/eimribar/Desktop/Agentss ads/meta ads/get-insights.sh`
- `/Users/eimribar/Desktop/Agentss ads/meta ads/get-pixel-stats.sh`
- `/Users/eimribar/Desktop/Agentss ads/.env`
- `/Users/eimribar/Desktop/Agentss ads/README.md`
- `/Users/eimribar/Desktop/Agentss ads/google-ads/SETUP.md`
- `/Users/eimribar/Desktop/Agentss ads/tiktok-ads/SETUP.md`
- `/Users/eimribar/Desktop/Agentss ads/command-center/` (entire directory)
  - `package.json`
  - `bin/ads`
  - `src/index.js`
  - `src/platforms/meta.js`
  - `src/platforms/reddit.js`
  - `src/platforms/analytics.js`
  - `src/platforms/google-ads.js`
  - `src/platforms/tiktok.js`
  - `src/platforms/index.js`
  - `src/commands/report.js`
  - `src/commands/campaigns.js`
  - `src/commands/conversions.js`
  - `src/commands/optimize.js`
  - `src/utils/api.js`
  - `src/utils/format.js`
