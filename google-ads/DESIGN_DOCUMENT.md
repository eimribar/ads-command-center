# Agentss AI - Google Ads API Tool Design Document

**Company:** Agentss AI
**Website:** https://agentss.ai
**Document Version:** 1.0
**Date:** January 5, 2026

---

## 1. Executive Summary

Agentss AI is developing an internal advertising management tool called "Ads Command Center" to consolidate campaign management and conversion tracking across multiple advertising platforms, including Google Ads.

This document describes the design and intended use of the Google Ads API integration.

---

## 2. Company Overview

**Business Model:** B2B SaaS platform providing AI-powered lead generation and sales automation tools.

**Use of Google Ads:** We run Google Ads campaigns to acquire customers for our platform, including:
- Search campaigns targeting businesses seeking lead generation solutions
- Display campaigns for brand awareness
- Remarketing campaigns for website visitors

**API Usage Type:** Internal tool for our own advertising management (not an agency tool).

---

## 3. Tool Overview

### 3.1 Tool Name
Agentss Ads Command Center

### 3.2 Purpose
Provide a unified dashboard for our marketing team to:
1. Monitor campaign performance across Google Ads and other platforms
2. Track and report on advertising ROI
3. Send offline conversion data to improve campaign optimization
4. Automate routine campaign management tasks

### 3.3 Users
- Internal marketing team members only
- Estimated 3-5 users
- No external/client access

---

## 4. Google Ads API Usage

### 4.1 API Services Required

| Service | Purpose | Frequency |
|---------|---------|-----------|
| GoogleAdsService | Query campaign, ad group, and ad performance data | Daily/On-demand |
| ConversionUploadService | Upload offline conversions (demo bookings, purchases) | Real-time |
| CampaignService | Read campaign settings and status | Daily |
| CustomerService | Retrieve account information | On startup |

### 4.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENTSS ADS COMMAND CENTER                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ OAuth 2.0 Authentication
                              │ (Refresh Token Flow)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GOOGLE ADS API v18                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────┐ │
│  │ GoogleAdsService│    │ConversionUpload │    │ Campaign   │ │
│  │                 │    │    Service      │    │  Service   │ │
│  │ - Search queries│    │                 │    │            │ │
│  │ - GAQL support  │    │ - Click conv.   │    │ - Status   │ │
│  │ - Reporting     │    │ - Call conv.    │    │ - Settings │ │
│  └─────────────────┘    └─────────────────┘    └────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE ADS ACCOUNT                           │
│                  Customer ID: 901-172-6337                      │
│                  (Under MCC: 983-707-4158)                      │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Authentication Method

We use OAuth 2.0 with offline refresh tokens:

1. Initial authorization via Google OAuth consent screen
2. Store refresh token securely in environment variables
3. Exchange refresh token for access token on each API session
4. Access token used for API calls (1-hour validity)

**Security measures:**
- Refresh tokens stored in encrypted environment variables
- Never committed to version control (.gitignore)
- Access limited to authorized team members only

---

## 5. Feature Specifications

### 5.1 Campaign Performance Dashboard

**Purpose:** Display real-time campaign metrics in unified view

**API Calls:**
```sql
SELECT
  campaign.name,
  campaign.status,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
```

**Frequency:** On-demand (user-initiated) + daily automated sync

### 5.2 Offline Conversion Upload

**Purpose:** Send conversion data from our CRM to Google Ads for optimization

**Use Case:** When a user from a Google Ad clicks through and later:
- Books a demo (conversion)
- Becomes a paying customer (conversion with value)

**Data Flow:**
1. User clicks Google Ad → lands on agentss.ai
2. GCLID captured and stored with user record
3. User books demo or purchases subscription
4. Conversion sent to Google Ads API with GCLID

**API Call Example:**
```javascript
// ConversionUploadService
uploadClickConversions({
  customerId: "9011726337",
  conversions: [{
    gclid: "user_gclid_from_click",
    conversionAction: "customers/9011726337/conversionActions/123456",
    conversionDateTime: "2026-01-05 12:00:00-05:00",
    conversionValue: 99.00,
    currencyCode: "USD"
  }]
})
```

### 5.3 Automated Reporting

**Purpose:** Generate weekly performance summaries

**Frequency:** Weekly (Sunday midnight)

**Output:** Email report to marketing team with key metrics

---

## 6. Rate Limiting & Best Practices

### 6.1 Request Volume Estimates

| Operation | Estimated Daily Volume |
|-----------|----------------------|
| Campaign queries | 50-100 requests |
| Conversion uploads | 10-50 requests |
| Account info queries | 5-10 requests |
| **Total** | **~150 requests/day** |

### 6.2 Rate Limit Compliance

- Implement exponential backoff for rate limit errors
- Cache campaign data locally (15-minute TTL)
- Batch conversion uploads where possible
- Use pageToken for paginated results

### 6.3 Error Handling

- Log all API errors with full context
- Retry transient errors (5xx, RESOURCE_EXHAUSTED)
- Alert on authentication failures
- Queue failed conversions for retry

---

## 7. Data Storage & Privacy

### 7.1 Data Stored

| Data Type | Storage Location | Retention |
|-----------|-----------------|-----------|
| Campaign metrics | Local database | 90 days |
| Conversion events | Local database | 1 year |
| API credentials | Environment vars | Permanent |

### 7.2 Privacy Compliance

- No PII stored from Google Ads data
- Conversion data uses GCLIDs only (no email/phone)
- Data access restricted to authorized personnel
- Compliant with Google Ads data policies

---

## 8. Technical Architecture

### 8.1 Technology Stack

- **Language:** JavaScript (Node.js)
- **API Library:** google-ads-api (npm package)
- **Authentication:** googleapis OAuth2 client
- **Data Storage:** PostgreSQL (for caching)
- **Hosting:** Internal servers / Vercel

### 8.2 Code Structure

```
agentss-ads-command-center/
├── .env                    # API credentials (not in git)
├── google-ads/
│   ├── api.sh             # Shell helper for GAQL queries
│   ├── list-campaigns.sh  # Campaign listing script
│   └── send-conversion.sh # Conversion upload script
├── command-center/
│   └── src/
│       └── platforms/
│           └── google.js  # Google Ads API client
└── package.json
```

---

## 9. Compliance & Terms

### 9.1 Terms Acknowledgment

We acknowledge and agree to:
- Google Ads API Terms and Conditions
- Google Ads API Rate Limits
- Required Minimum Functionality (RMF)
- Data handling and privacy requirements

### 9.2 Use Case Compliance

Our use case falls under:
- **Internal Tool:** Used by our own marketing team
- **Conversion Tracking:** Uploading our own conversion data
- **Reporting:** Generating reports for our own campaigns

We are NOT:
- Building an agency tool for clients
- Reselling API access
- Automating ad creation at scale

---

## 10. Contact Information

**Company:** Agentss AI
**Primary Contact:** Eimri Bar
**Email:** eimrib@yess.ai
**Website:** https://agentss.ai

---

*Document prepared for Google Ads API Token Application*
*January 2026*
