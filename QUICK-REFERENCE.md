# Agentss Ads - Quick Reference Card

## 🔄 Daily Operations

### Check Yesterday's Stats
```bash
/Users/eimribar/google-analytics/get-events.sh
```

### Refresh Expired Tokens
```bash
# Reddit (every 24 hours)
/Users/eimribar/reddit-ads/refresh-token.sh

# Google Analytics (every 1 hour)
/Users/eimribar/google-analytics/refresh-token.sh
```

---

## 📊 Analytics Queries

### Events by Day
```bash
/Users/eimribar/google-analytics/get-events.sh yesterday yesterday
/Users/eimribar/google-analytics/get-events.sh 7daysAgo today
/Users/eimribar/google-analytics/get-events.sh 2025-12-01 2025-12-31
```

### User Count
```bash
source /Users/eimribar/google-analytics/.env
curl -s -X POST "https://analyticsdata.googleapis.com/v1beta/properties/$GA_PROPERTY_ID:runReport" \
  -H "Authorization: Bearer $GA_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dateRanges":[{"startDate":"yesterday","endDate":"yesterday"}],"metrics":[{"name":"totalUsers"},{"name":"newUsers"},{"name":"sessions"}]}' | jq '.rows[0].metricValues'
```

---

## 📢 Reddit Ads

### List Campaigns
```bash
/Users/eimribar/reddit-ads/list-campaigns.sh
```

### Send Conversion Event
```bash
# Purchase
/Users/eimribar/reddit-ads/send-conversion.sh Purchase user@email.com

# Add to Cart
/Users/eimribar/reddit-ads/send-conversion.sh AddToCart

# Lead with click ID
/Users/eimribar/reddit-ads/send-conversion.sh Lead user@email.com rdt_click_id
```

### Generic API Call
```bash
/Users/eimribar/reddit-ads/api.sh GET /me
/Users/eimribar/reddit-ads/api.sh GET /ad_accounts/a2_gu5cal6xbcpp/campaigns
```

---

## 📘 Meta Ads (Facebook)

### Send CAPI Conversion
```bash
# Purchase with order ID and value
"/Users/eimribar/Desktop/Agentss ads/meta ads/send-conversion.sh" Purchase user@email.com ORDER_123 49.99

# AddToCart
"/Users/eimribar/Desktop/Agentss ads/meta ads/send-conversion.sh" AddToCart user@email.com

# Lead
"/Users/eimribar/Desktop/Agentss ads/meta ads/send-conversion.sh" Lead user@email.com
```

### Get Pixel Stats
```bash
"/Users/eimribar/Desktop/Agentss ads/meta ads/get-pixel-stats.sh"
```

### Get Performance Insights
```bash
"/Users/eimribar/Desktop/Agentss ads/meta ads/get-insights.sh" yesterday
"/Users/eimribar/Desktop/Agentss ads/meta ads/get-insights.sh" last_7d
```

---

## 🚫 Exclude Yourself from Tracking

### Enable (run once in browser console on agentss.com)
```javascript
localStorage.setItem('disable_analytics', 'true')
```

### Disable (to see your own activity again)
```javascript
localStorage.removeItem('disable_analytics')
```

---

## 🔑 Key IDs

| Platform | ID Type | Value |
|----------|---------|-------|
| Reddit | Pixel ID | `a2_gu5cal6xbcpp` |
| Reddit | Ad Account | `a2_gu5cal6xbcpp` |
| Reddit | Business | `9ed0f11d-cc74-493c-88f3-4556ce79cafb` |
| GA4 | Property ID | `517403460` |
| GA4 | Measurement ID | `G-TJL2K4VTJF` |
| Meta | Pixel ID | `1146945313925793` |
| Meta | Ad Account | `act_793339687067142` |
| Meta | System User | `122104747695182090` |

---

## 📁 File Locations

| Purpose | Location |
|---------|----------|
| Reddit scripts | `/Users/eimribar/reddit-ads/` |
| Meta scripts | `/Users/eimribar/Desktop/Agentss ads/meta ads/` |
| GA scripts | `/Users/eimribar/google-analytics/` |
| Master docs | `/Users/eimribar/Desktop/Agentss ads/` |
| Website code | `/Users/eimribar/Desktop/Projects/Agentss Minimal/` |

---

## 🔗 Quick Links

- [Reddit Ads Manager](https://ads.reddit.com)
- [Meta Ads Manager](https://adsmanager.facebook.com)
- [Meta Events Manager](https://business.facebook.com/events_manager)
- [GA4 Dashboard](https://analytics.google.com/analytics/web/#/a265488307p517403460)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
