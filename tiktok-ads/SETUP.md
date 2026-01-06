# TikTok Ads API Setup Guide

## Prerequisites
You need a TikTok for Business account to use the Marketing API.

---

## Step 1: Create TikTok Business Account

1. Go to https://ads.tiktok.com
2. Click "Create an Ad" or "Sign Up"
3. Sign in with your TikTok account (or create one)
4. Complete business verification
5. Set up your first Ad Account
6. Note your **Advertiser ID** from the dashboard

---

## Step 2: Register as a Developer

1. Go to https://developers.tiktok.com
2. Click "My Apps" in the top right
3. Sign in with your TikTok for Business account
4. Click "Create App"
5. Select **Marketing API** as the product
6. Fill in app details:
   - **App Name**: Agentss Ads Manager
   - **Description**: Internal ads management tool
   - **App Category**: Marketing/Advertising

---

## Step 3: Get API Credentials

After creating your app:

1. Go to your app's dashboard
2. Note down:
   - **App ID**
   - **App Secret**
3. Configure OAuth settings:
   - **Redirect URI**: `https://localhost:3000/callback` (or your server)
   - **Scopes**: Select all marketing-related scopes

---

## Step 4: Complete OAuth Flow

```bash
# Set your credentials
APP_ID="your-app-id"
APP_SECRET="your-app-secret"
REDIRECT_URI="https://localhost:3000/callback"

# Step 1: Get authorization URL
echo "Visit this URL to authorize:"
echo "https://ads.tiktok.com/marketing_api/auth?app_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&state=random123"

# Step 2: After granting access, you'll be redirected with an auth_code
AUTH_CODE="paste-code-here"

# Step 3: Exchange for access token
curl -s -X POST "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/" \
  -H "Content-Type: application/json" \
  -d "{
    \"app_id\": \"${APP_ID}\",
    \"secret\": \"${APP_SECRET}\",
    \"auth_code\": \"${AUTH_CODE}\"
  }"
```

The response will include:
- `access_token` - Long-lived access token
- `advertiser_ids` - List of ad accounts you have access to

---

## Step 5: Set Up TikTok Pixel

1. Go to TikTok Ads Manager
2. Navigate to **Assets** > **Events** > **Web Events**
3. Click "Create Pixel"
4. Name it "Agentss Pixel"
5. Choose "Manually Install Pixel Code"
6. Note your **Pixel ID**

---

## Step 6: Update Credentials

Once you have all the credentials, update the `.env` file:

```bash
# TikTok Ads API
TIKTOK_APP_ID="your-app-id"
TIKTOK_SECRET="your-app-secret"
TIKTOK_ACCESS_TOKEN="your-access-token"
TIKTOK_ADVERTISER_ID="your-advertiser-id"
TIKTOK_PIXEL_ID="your-pixel-id"
```

---

## Step 7: Test the Connection

After setup, run:
```bash
./test-connection.sh
```

---

## API Documentation

- **Official Docs**: https://ads.tiktok.com/marketing_api/docs
- **API Reference**: https://ads.tiktok.com/marketing_api/docs?id=1738855176671234
- **Events API (CAPI)**: https://ads.tiktok.com/marketing_api/docs?id=1741601162187777

---

## Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/campaign/get/` | List campaigns |
| `/campaign/create/` | Create campaign |
| `/campaign/update/status/` | Pause/resume campaign |
| `/report/integrated/get/` | Get performance reports |
| `/pixel/track/` | Send conversion events |

---

## Events API (Server-Side Tracking)

TikTok's Events API is similar to Meta CAPI:

```bash
curl -X POST "https://business-api.tiktok.com/open_api/v1.3/pixel/track/" \
  -H "Access-Token: YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pixel_code": "YOUR_PIXEL_ID",
    "event": "CompletePayment",
    "event_id": "unique-event-id",
    "timestamp": "2025-12-30T12:00:00Z",
    "context": {
      "user": {
        "email": "sha256_hashed_email"
      },
      "page": {
        "url": "https://agentss.com/checkout"
      }
    },
    "properties": {
      "currency": "USD",
      "value": 49.99
    }
  }'
```

---

## Notes

- TikTok access tokens are long-lived (usually 1 year)
- Advertiser IDs are numeric strings
- Events API supports hashed PII for privacy
- Rate limits: 600 requests per minute per app
