# Reddit Ads API - Complete Reference

## Overview

Reddit Ads API v3 for campaign management, v2.0 for Conversions API (CAPI).

**Base URLs:**
- Ads API: `https://ads-api.reddit.com/api/v3`
- Conversions API: `https://ads-api.reddit.com/api/v2.0`
- OAuth: `https://www.reddit.com/api/v1`

---

## Authentication

### OAuth 2.0 Setup

1. Create app at: https://www.reddit.com/prefs/apps
2. Type: **script**
3. Redirect URI: `http://localhost:8080/callback`

### Get Initial Tokens

```bash
# Step 1: Authorization URL (open in browser)
https://www.reddit.com/api/v1/authorize?client_id=YOUR_APP_ID&response_type=code&state=random123&redirect_uri=http://localhost:8080/callback&duration=permanent&scope=adsconversions,adsread,adswrite

# Step 2: Exchange code for tokens
curl -X POST "https://www.reddit.com/api/v1/access_token" \
    -u "APP_ID:APP_SECRET" \
    -d "grant_type=authorization_code&code=CODE&redirect_uri=http://localhost:8080/callback"
```

### Refresh Access Token (REQUIRED DAILY - tokens expire in 24h)

```bash
curl -X POST "https://www.reddit.com/api/v1/access_token" \
    -u "APP_ID:APP_SECRET" \
    -A "YourApp/1.0" \
    -d "grant_type=refresh_token&refresh_token=YOUR_REFRESH_TOKEN"
```

---

## Account Structure

```
Account Hierarchy:
├── Business (business_id)
│   └── Ad Account (a2_xxxxx)
│       ├── Campaigns
│       │   └── Ad Groups
│       │       └── Ads
│       └── Pixels (same ID as ad account)
└── Profile (t2_xxxxx) - for creating posts
```

### Get Account IDs

```bash
# Get profile/user info
curl -s "https://ads-api.reddit.com/api/v3/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN"

# Get businesses
curl -s "https://ads-api.reddit.com/api/v3/businesses" \
    -H "Authorization: Bearer $ACCESS_TOKEN"

# Get ad accounts for business
curl -s "https://ads-api.reddit.com/api/v3/businesses/BUSINESS_ID/ad_accounts" \
    -H "Authorization: Bearer $ACCESS_TOKEN"

# Get profile for post creation
curl -s "https://ads-api.reddit.com/api/v3/ad_accounts/AD_ACCOUNT_ID/profiles" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Campaigns

### List Campaigns

```bash
curl -s "https://ads-api.reddit.com/api/v3/ad_accounts/AD_ACCOUNT_ID/campaigns" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Create Campaign

```bash
curl -s -X POST "https://ads-api.reddit.com/api/v3/ad_accounts/AD_ACCOUNT_ID/campaigns" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "data": {
            "name": "Campaign Name",
            "configured_status": "PAUSED",
            "objective": "CONVERSIONS"
        }
    }'
```

**Campaign Objectives:**
- `CONVERSIONS` - Conversion campaigns (leads, purchases)
- `CLICKS` - Traffic campaigns
- `IMPRESSIONS` - Brand awareness
- `APP_INSTALLS` - Mobile app installs
- `CATALOG_SALES` - E-commerce product catalog
- `VIDEO_VIEWS` - Video engagement

### Update Campaign Status

```bash
curl -s -X PUT "https://ads-api.reddit.com/api/v3/campaigns/CAMPAIGN_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "data": {
            "configured_status": "ACTIVE"
        }
    }'
```

---

## Ad Groups

### List Ad Groups

```bash
curl -s "https://ads-api.reddit.com/api/v3/ad_accounts/AD_ACCOUNT_ID/ad_groups" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Create Ad Group (REQUIRED FIELDS)

```bash
START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -s -X POST "https://ads-api.reddit.com/api/v3/ad_accounts/AD_ACCOUNT_ID/ad_groups" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "data": {
            "campaign_id": "CAMPAIGN_ID",
            "name": "Ad Group Name",
            "configured_status": "PAUSED",
            "bid_strategy": "MAXIMIZE_VOLUME",
            "bid_type": "CPC",
            "bid_value": 500000,
            "goal_value": 5000000,
            "optimization_goal": "LEAD",
            "view_through_conversion_type": "SEVEN_DAY_CLICKS_ONE_DAY_VIEW",
            "start_time": "'$START_TIME'",
            "targeting": {
                "geolocations": ["US"]
            }
        }
    }'
```

**Required Fields for Conversion Campaigns:**
| Field | Description | Example |
|-------|-------------|---------|
| `campaign_id` | Parent campaign | `"2404462911986962808"` |
| `name` | Ad group name | `"US Leads"` |
| `bid_strategy` | Bidding strategy | `MAXIMIZE_VOLUME`, `MANUAL_BIDDING`, `TARGET_CPX` |
| `bid_type` | Bid type | `CPC`, `CPM`, `CPV` |
| `bid_value` | Bid in micros ($0.50 = 500000) | `500000` |
| `goal_value` | Daily spend min $5 (5000000 micros) | `5000000` |
| `optimization_goal` | Conversion goal | `LEAD`, `PAGE_VISIT`, `PURCHASE`, `SIGN_UP`, `ADD_TO_CART` |
| `view_through_conversion_type` | Attribution window | `SEVEN_DAY_CLICKS`, `SEVEN_DAY_CLICKS_ONE_DAY_VIEW` |
| `start_time` | ISO 8601 datetime | `"2025-12-31T07:00:00Z"` |

**Targeting Options:**
```json
"targeting": {
    "geolocations": ["US", "CA", "GB"],
    "platforms": ["DESKTOP", "MOBILE", "ALL"],
    "communities": ["technology", "startups"],
    "interests": ["technology", "business"],
    "devices": ["ANDROID", "IOS"],
    "age_targeting": {"min": 25, "max": 55}
}
```

---

## Posts (Creatives)

### Create Post (Required for Ads)

**Endpoint:** `POST /api/v3/profiles/{profile_id}/posts`

```bash
# Get profile_id first
PROFILE_ID="t2_xxxxx"  # From /ad_accounts/AD_ACCOUNT_ID/profiles

# Create IMAGE post with destination URL (required for conversions)
curl -s -X POST "https://ads-api.reddit.com/api/v3/profiles/$PROFILE_ID/posts" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "data": {
            "headline": "Your Headline Here",
            "type": "IMAGE",
            "allow_comments": false,
            "content": [{
                "destination_url": "https://www.yoursite.com",
                "display_url": "yoursite.com",
                "call_to_action": "Learn More",
                "media_url": "https://example.com/image.jpg"
            }]
        }
    }'
```

**Post Types:**
- `TEXT` - Text-only (no destination URL, can't be used for conversions)
- `IMAGE` - Image with destination URL
- `VIDEO` - Video with thumbnail
- `CAROUSEL` - Multiple images (up to 6)

**Call to Action Options:**
`Apply Now`, `Contact Us`, `Download`, `Get a Quote`, `Get Showtimes`, `Install`, `Learn More`, `Order Now`, `Play Now`, `Pre-order Now`, `See Menu`, `Shop Now`, `Sign Up`, `View More`, `Watch Now`, `Book Now`, `Buy Tickets`, `Get Directions`, `Listen Now`, `Read More`, `Subscribe`, `Visit Store`, `Donate Now`

---

## Ads

### List Ads

```bash
curl -s "https://ads-api.reddit.com/api/v3/ad_accounts/AD_ACCOUNT_ID/ads" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Create Ad

```bash
curl -s -X POST "https://ads-api.reddit.com/api/v3/ad_accounts/AD_ACCOUNT_ID/ads" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "data": {
            "ad_group_id": "AD_GROUP_ID",
            "name": "Ad Name",
            "post_id": "t3_xxxxx",
            "configured_status": "PAUSED"
        }
    }'
```

**Note:** For conversion campaigns, the post MUST have a `destination_url` in its content. Use IMAGE, VIDEO, or CAROUSEL type posts.

---

## Conversions API (CAPI)

### Endpoint: `POST /api/v2.0/conversions/events/{ad_account_id}`

**NOT v3!** The Conversions API uses v2.0.

### Send Conversion Event

```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
HASHED_EMAIL=$(echo -n "user@example.com" | shasum -a 256 | cut -d' ' -f1)

curl -s -X POST "https://ads-api.reddit.com/api/v2.0/conversions/events/AD_ACCOUNT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "test_mode": false,
        "events": [{
            "event_at": "'$TIMESTAMP'",
            "event_type": {
                "tracking_type": "Lead"
            },
            "user": {
                "email": "'$HASHED_EMAIL'"
            },
            "event_metadata": {
                "conversion_id": "unique_event_id_123",
                "item_count": 1,
                "value_decimal": 99.00,
                "currency": "USD"
            }
        }]
    }'
```

**Event Types (tracking_type):**
- `PageVisit` - Page view
- `ViewContent` - Content viewed
- `Search` - Search performed
- `AddToCart` - Added to cart
- `AddToWishlist` - Added to wishlist
- `Purchase` - Purchase completed
- `Lead` - Lead form submitted
- `SignUp` - User signed up
- `Custom` - Custom event

**User Matching Fields (hash with SHA-256):**
- `email` - Hashed email (lowercase, trimmed)
- `external_id` - Your user ID
- `idfa` - iOS advertising ID
- `aaid` - Android advertising ID
- `click_id` - Reddit click ID from URL parameter

**Event Metadata:**
```json
"event_metadata": {
    "conversion_id": "unique_id",      // Deduplication ID
    "item_count": 1,                    // Number of items
    "value_decimal": 99.00,             // Conversion value
    "currency": "USD"                   // ISO currency code
}
```

---

## Complete Flow Example

```bash
#!/bin/bash
# Complete Reddit Ads Flow

# 1. Refresh token
ACCESS_TOKEN=$(curl -s -X POST "https://www.reddit.com/api/v1/access_token" \
    -u "APP_ID:SECRET" -A "App/1.0" \
    -d "grant_type=refresh_token&refresh_token=REFRESH_TOKEN" | jq -r '.access_token')

# 2. Create Campaign
CAMPAIGN=$(curl -s -X POST "https://ads-api.reddit.com/api/v3/ad_accounts/AD_ACCOUNT_ID/campaigns" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"data": {"name": "My Campaign", "objective": "CONVERSIONS", "configured_status": "PAUSED"}}')
CAMPAIGN_ID=$(echo "$CAMPAIGN" | jq -r '.data.id')

# 3. Create Ad Group
AD_GROUP=$(curl -s -X POST "https://ads-api.reddit.com/api/v3/ad_accounts/AD_ACCOUNT_ID/ad_groups" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "data": {
            "campaign_id": "'$CAMPAIGN_ID'",
            "name": "My Ad Group",
            "bid_strategy": "MAXIMIZE_VOLUME",
            "bid_type": "CPC",
            "bid_value": 500000,
            "goal_value": 5000000,
            "optimization_goal": "LEAD",
            "view_through_conversion_type": "SEVEN_DAY_CLICKS_ONE_DAY_VIEW",
            "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
            "targeting": {"geolocations": ["US"]}
        }
    }')
AD_GROUP_ID=$(echo "$AD_GROUP" | jq -r '.data.id')

# 4. Create Post
POST=$(curl -s -X POST "https://ads-api.reddit.com/api/v3/profiles/PROFILE_ID/posts" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "data": {
            "headline": "My Ad Headline",
            "type": "IMAGE",
            "allow_comments": false,
            "content": [{
                "destination_url": "https://mysite.com",
                "display_url": "mysite.com",
                "call_to_action": "Learn More",
                "media_url": "https://example.com/image.jpg"
            }]
        }
    }')
POST_ID=$(echo "$POST" | jq -r '.data.id')

# 5. Create Ad
AD=$(curl -s -X POST "https://ads-api.reddit.com/api/v3/ad_accounts/AD_ACCOUNT_ID/ads" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "data": {
            "ad_group_id": "'$AD_GROUP_ID'",
            "name": "My Ad",
            "post_id": "'$POST_ID'",
            "configured_status": "PAUSED"
        }
    }')

# 6. Send Conversion
curl -s -X POST "https://ads-api.reddit.com/api/v2.0/conversions/events/AD_ACCOUNT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "test_mode": false,
        "events": [{
            "event_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
            "event_type": {"tracking_type": "Lead"},
            "user": {"email": "HASHED_EMAIL"},
            "event_metadata": {"conversion_id": "evt_123", "item_count": 1}
        }]
    }'
```

---

## Error Handling

### Common Errors

| Error | Solution |
|-------|----------|
| `bid_strategy is required` | Add `bid_strategy`: MAXIMIZE_VOLUME, MANUAL_BIDDING, or TARGET_CPX |
| `bid_type is required` | Add `bid_type`: CPC, CPM, or CPV |
| `goal_value must be at least $5.00` | Set `goal_value` >= 5000000 (micros) |
| `optimization_goal not supported` | Use: LEAD, PAGE_VISIT, PURCHASE, SIGN_UP, ADD_TO_CART |
| `view_through_conversion_type required` | Add: SEVEN_DAY_CLICKS or SEVEN_DAY_CLICKS_ONE_DAY_VIEW |
| `post_id is invalid` | Post must have destination_url for conversion campaigns |
| `Free form ads cannot have click url` | Don't pass click_url; use post's destination_url |

---

## Rate Limits

- Account Management: 200 requests/60 seconds
- Campaign Management: 200 requests/60 seconds
- Creative Management: 200 requests/60 seconds
- Conversions API: Higher limits (batch friendly)

---

## Verified Working - December 2025

- Campaign creation
- Ad Group creation with all required fields
- Post creation via /profiles/{id}/posts
- Ad creation linking post to ad group
- CAPI v2.0 conversion tracking

**Agentss Account IDs:**
- Ad Account: `a2_gu5cal6xbcpp`
- Profile: `t2_ajxlr5i2`
- Business: `9ed0f11d-cc74-493c-88f3-4556ce79cafb`
