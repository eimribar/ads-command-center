# Google Ads API Setup Guide

## Prerequisites
You need a Google Ads account with Manager (MCC) access to use the API.

---

## Step 1: Create Google Ads Account

1. Go to https://ads.google.com
2. Click "Start Now" and sign in with your Google account
3. Follow the setup wizard to create your first campaign (you can pause it immediately)
4. Note your **Customer ID** (format: XXX-XXX-XXXX) from the top right corner

---

## Step 2: Create Manager Account (MCC)

The Google Ads API requires a Manager Account to access.

1. Go to https://ads.google.com/home/tools/manager-accounts/
2. Click "Create a Manager Account"
3. Fill in your business details
4. Note your **Manager Customer ID** (also format: XXX-XXX-XXXX)
5. Link your regular Google Ads account to this Manager account

---

## Step 3: Apply for Developer Token

1. Sign in to your Manager Account
2. Go to https://ads.google.com/aw/apicenter
3. Click "Apply for API access"
4. Fill out the application form:
   - **API Usage**: Select "Managing my own ads accounts"
   - **Company Info**: Your business details
   - **API Use Case**: Describe your automation needs
5. Submit and wait for approval (usually 24-48 hours for Basic access)

**Token Levels:**
- **Test Account**: Free, limited to test accounts only
- **Basic Access**: Most features, up to 15,000 operations/day
- **Standard Access**: Full features, higher limits

---

## Step 4: OAuth2 Setup

Use the same OAuth credentials from Google Analytics, or create new ones:

1. Go to https://console.cloud.google.com/apis/credentials
2. Select your project (or create one)
3. Enable the "Google Ads API" at https://console.cloud.google.com/apis/library/googleads.googleapis.com
4. Create OAuth 2.0 Client ID (Desktop app type)
5. Download the credentials JSON

---

## Step 5: Complete OAuth Flow

```bash
# Set your credentials
CLIENT_ID="your-client-id"
CLIENT_SECRET="your-client-secret"

# Step 1: Get authorization URL
echo "Visit this URL to authorize:"
echo "https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=urn:ietf:wg:oauth:2.0:oob&scope=https://www.googleapis.com/auth/adwords&response_type=code&access_type=offline"

# Step 2: After granting access, you'll get a code. Exchange it for tokens:
AUTH_CODE="paste-code-here"

curl -s -X POST "https://oauth2.googleapis.com/token" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "code=${AUTH_CODE}" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob"
```

---

## Step 6: Update Credentials

Once you have all the credentials, update the `.env` file:

```bash
# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN="your-developer-token"
GOOGLE_ADS_CLIENT_ID="your-client-id"
GOOGLE_ADS_CLIENT_SECRET="your-client-secret"
GOOGLE_ADS_REFRESH_TOKEN="your-refresh-token"
GOOGLE_ADS_CUSTOMER_ID="123-456-7890"           # Your ad account
GOOGLE_ADS_LOGIN_CUSTOMER_ID="987-654-3210"     # Your manager account
```

---

## Step 7: Test the Connection

After setup, run:
```bash
./test-connection.sh
```

---

## API Documentation

- **Official Docs**: https://developers.google.com/google-ads/api/docs/start
- **REST API Reference**: https://developers.google.com/google-ads/api/rest/reference/rest
- **Query Language (GAQL)**: https://developers.google.com/google-ads/api/docs/query/overview

---

## Notes

- Google Ads API uses a SQL-like query language called GAQL
- All API calls require both Developer Token AND OAuth access token
- Customer IDs should be passed without dashes in API calls (e.g., 1234567890)
- The API has rate limits based on your access level
