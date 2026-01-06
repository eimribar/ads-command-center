# Agentss AI — Meta Ads & Pixel Strategy
## Executive Summary Document

**Last Updated:** January 5, 2026
**Document Owner:** Marketing & Engineering Team

---

## 1. Overview

This document provides a complete reference for how Agentss AI's Meta (Facebook/Instagram) advertising infrastructure is configured, including the Pixel implementation, Conversions API (CAPI) setup, and campaign management tools.

### Key Objectives
- **Accurate Attribution:** Track user journey from ad click to demo booking
- **Event Deduplication:** Prevent double-counting between browser Pixel and server-side CAPI
- **Full-Funnel Tracking:** Capture PageView → Lead → Schedule → Purchase events
- **Cross-Platform Sync:** Unified tracking across Meta, PostHog, and Google Analytics

---

## 2. Account Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     META BUSINESS MANAGER                           │
│                    Agentss AI (2299862123857866)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│   │   AD ACCOUNT    │    │     PIXEL       │    │    PAGE      │  │
│   │   Agentss AI    │    │  Agentss Pixel  │    │  Agentss.ai  │  │
│   │                 │    │                 │    │              │  │
│   │ act_1182258...  │    │ 2368446756...   │    │ 903769172... │  │
│   │                 │    │                 │    │              │  │
│   │ Currency: USD   │    │ Events: CAPI +  │    │ Used for ads │  │
│   │ TZ: US/Eastern  │    │ Browser Pixel   │    │ & identity   │  │
│   └─────────────────┘    └─────────────────┘    └──────────────┘  │
│                                                                     │
│   ┌─────────────────┐    ┌─────────────────────────────────────┐  │
│   │      APP        │    │         SYSTEM USER TOKEN           │  │
│   │    Agentss      │    │                                     │  │
│   │                 │    │  Name: Claude Code                  │  │
│   │ 1285540256...   │    │  ID: 122109281043164355             │  │
│   │                 │    │  Permissions: ads_management,       │  │
│   │ API Access      │    │  ads_read, business_management      │  │
│   └─────────────────┘    └─────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Quick Reference Table

| Asset | ID | Purpose |
|-------|-----|---------|
| **Business Manager** | `2299862123857866` | Parent container for all Meta assets |
| **Ad Account** | `act_1182258557370297` | Where campaigns are created and billed |
| **Pixel** | `2368446756922318` | Tracks website events |
| **Page** | `903769172820940` | Facebook Page identity for ads |
| **App** | `1285540256903956` | API access credentials |

---

## 3. Tracking Implementation

### 3.1 Dual-Tracking Architecture

We use **both** browser-side Pixel AND server-side Conversions API (CAPI) for maximum data accuracy:

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    agentss.ai Website                            │
│                                                                  │
│   ┌────────────────────┐         ┌────────────────────┐        │
│   │   Browser Pixel    │         │   Event ID Store   │        │
│   │   (index.html)     │◄───────►│   (AgentssAds)     │        │
│   │                    │         │                    │        │
│   │   fbq('track',     │         │   Generates unique │        │
│   │     'Lead', {},    │         │   event_id per     │        │
│   │     {eventID: x}   │         │   event for dedup  │        │
│   └────────┬───────────┘         └────────────────────┘        │
│            │                                                     │
└────────────┼─────────────────────────────────────────────────────┘
             │
             │  event_id shared
             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Meta Servers                                 │
│                                                                  │
│   Browser Pixel ─────►  ┌─────────────────┐  ◄───── CAPI        │
│   (client-side)         │  DEDUPLICATION  │        (server-side)│
│                         │                 │                      │
│                         │  Same event_id  │                      │
│                         │  = counted once │                      │
│                         └─────────────────┘                      │
│                                  │                               │
│                                  ▼                               │
│                         Event attributed                         │
│                         to campaign/ad                           │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Events Tracked

| Event | Trigger | Meta Standard Event | Custom Parameters |
|-------|---------|---------------------|-------------------|
| **PageView** | Page load | `PageView` | `landing_page`, `utm_*` |
| **Lead** | CTA click (Book Demo) | `Lead` | `content_name`, `landing_page` |
| **Schedule** | Calendly booking confirmed | `Schedule` | `source: calendly` |
| **StartTrial** | Trial signup | `StartTrial` | `plan_type` |
| **Purchase** | Subscription created | `Purchase` | `value`, `currency`, `order_id` |

### 3.3 Event ID Deduplication

Every event is assigned a unique `event_id` using this format:
```
{event_name}_{timestamp_base36}_{random_string}
```

Example: `lead_m4x7k2_9f3a8b2c1d`

This ID is:
1. Generated once per event occurrence
2. Sent with browser Pixel (`eventID` parameter)
3. Sent with CAPI (`event_id` field)
4. Sent to PostHog (`event_id` property)

Meta deduplicates by matching `event_id` within a 48-hour window.

---

## 4. Code Locations

### 4.1 Production Website (agentss-production)

**File:** `/Users/eimribar/Desktop/Projects/agentss-production/index.html`

```
Lines 13-199:  AgentssAds tracking script
Line 108:      Meta Pixel initialization (ID: 2368446756922318)
Line 131:      PostHog initialization
Lines 155-181: Event tracking functions (trackLead, trackSchedule, etc.)
Line 322:      Noscript fallback pixel
```

**File:** `/Users/eimribar/Desktop/Projects/agentss-production/hooks/useTracking.ts`
- React hook for calling tracking functions from components
- Usage: `const { trackLead, trackSchedule } = useTracking();`

### 4.2 Command Center (Agentss ads command center)

**File:** `/Users/eimribar/Desktop/Projects/Agentss ads command center/.env`
- Master credentials file (all platforms)
- Meta API credentials for server-side operations

**File:** `/Users/eimribar/Desktop/Projects/Agentss ads command center/command-center/src/platforms/meta.js`
- Meta Marketing API client
- Functions: `getCampaigns()`, `getInsights()`, `sendConversion()`, `updateCampaign()`

**File:** `/Users/eimribar/Desktop/Projects/Agentss ads command center/meta ads/.env`
- Meta-specific credentials (mirrors main .env)

---

## 5. Credential Reference

### 5.1 Meta Ads API

| Variable | Value | Notes |
|----------|-------|-------|
| `META_APP_ID` | `1285540256903956` | App: "Agentss" |
| `META_APP_SECRET` | `efbe107b7b82e22e42968eb7e6e9ed0b` | Keep secret! |
| `META_ACCESS_TOKEN` | `EAAMazCSDU8wBQ...` | System User token |
| `META_AD_ACCOUNT_ID` | `act_1182258557370297` | Include `act_` prefix |
| `META_BUSINESS_ID` | `2299862123857866` | Business Manager ID |
| `META_PAGE_ID` | `903769172820940` | Facebook Page |
| `META_PIXEL_ID` | `2368446756922318` | For CAPI calls |
| `META_API_VERSION` | `v21.0` | Current API version |

### 5.2 Token Management

**Current Token Type:** System User Token
**Token Owner:** Claude Code (System User)
**Permissions Required:**
- `ads_management` - Create/edit campaigns
- `ads_read` - Read campaign performance
- `business_management` - Access Business Manager assets

**Token Refresh:**
- System User tokens are long-lived (60 days by default)
- To refresh: Business Settings → System Users → Generate New Token
- Update in both `.env` files after refresh

---

## 6. How to Work With This Setup

### 6.1 Viewing Campaign Performance

**Option A: Meta Ads Manager (UI)**
```
https://business.facebook.com/adsmanager/manage/campaigns?act=1182258557370297
```

**Option B: Command Center CLI**
```bash
cd "/Users/eimribar/Desktop/Projects/Agentss ads command center"
node command-center/src/index.js campaigns
```

**Option C: Direct API Call**
```bash
curl "https://graph.facebook.com/v21.0/act_1182258557370297/campaigns?fields=id,name,status,objective&access_token=YOUR_TOKEN"
```

### 6.2 Sending Server-Side Events (CAPI)

Use the command center's `sendConversion` function:

```javascript
import meta from './platforms/meta.js';

// Track a lead event
await meta.sendConversion('Lead', {
  email: 'user@example.com',
  firstName: 'John'
}, {
  url: 'https://agentss.ai/demo',
  eventId: 'lead_abc123'  // Must match browser event_id
});
```

### 6.3 Debugging Pixel Events

1. **Meta Events Manager:** https://business.facebook.com/events_manager2/list/pixel/2368446756922318
2. **Pixel Helper Chrome Extension:** Install from Chrome Web Store
3. **Test Events Tool:** Events Manager → Test Events → Enter website URL

### 6.4 Adding New Events

1. Add to `index.html` in the AgentssAds object:
```javascript
window.AgentssAds.trackNewEvent = function(params) {
  var eventId = this.getEventId('NewEvent');
  this.trackMeta('NewEvent', params, { eventId: eventId });
  this.trackPostHog('new_event', Object.assign({ event_id: eventId }, params));
  return eventId;
};
```

2. Add to `useTracking.ts` hook:
```typescript
const trackNewEvent = (params?: Record<string, unknown>): string => {
  if (window.AgentssAds?.trackNewEvent) {
    return window.AgentssAds.trackNewEvent(params);
  }
  return trackEvent('NewEvent', params).eventId;
};
```

3. Register as Custom Conversion in Events Manager (optional, for optimization)

---

## 7. Integration with Other Platforms

### 7.1 PostHog Analytics

Events are automatically sent to PostHog with the same `event_id` for cross-platform attribution:

| Meta Event | PostHog Event |
|------------|---------------|
| PageView | `$pageview` |
| Lead | `lead_generated` |
| Schedule | `demo_scheduled` |
| StartTrial | `trial_started` |
| Purchase | `subscription_created` |

**PostHog Project:** `phc_JAlgbrIdqPf8VU1APqRCYzygOSSJR7eMZjybPSwwKUe`

### 7.2 Google Analytics

- **Property ID:** G-B7YB9725LR
- GTM Container: GTM-KBKLXDNG
- Pageviews tracked automatically via gtag

### 7.3 UTM Parameter Flow

UTM parameters from ad URLs are:
1. Extracted on page load
2. Stored in sessionStorage
3. Attached to all events (Meta, PostHog, GA)
4. Used for first-touch and last-touch attribution in PostHog

---

## 8. Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Events not appearing in Events Manager | Token expired or wrong Pixel ID | Verify token with `/me` endpoint, check Pixel ID |
| Duplicate events | Missing event_id | Ensure both Pixel and CAPI use same event_id |
| Low Event Match Quality | Missing user data | Add email, phone, fbclid to CAPI calls |
| "Invalid OAuth token" error | Token expired | Generate new System User token |
| Conversion not attributed | Wrong ad account | Verify `act_` prefix, check Business Manager permissions |

---

## 9. Security Notes

- **Never commit `.env` files to git** — they're in `.gitignore`
- **Token rotation:** Refresh access tokens every 60 days
- **App Secret:** Never expose `META_APP_SECRET` in client-side code
- **CAPI only:** Server-side events should only be sent from secure backends

---

## 10. Quick Links

| Resource | URL |
|----------|-----|
| Meta Business Manager | https://business.facebook.com/settings/business-info?business_id=2299862123857866 |
| Ads Manager | https://business.facebook.com/adsmanager/manage/campaigns?act=1182258557370297 |
| Events Manager | https://business.facebook.com/events_manager2/list/pixel/2368446756922318 |
| Meta Marketing API Docs | https://developers.facebook.com/docs/marketing-apis |
| Conversions API Docs | https://developers.facebook.com/docs/marketing-api/conversions-api |
| PostHog Dashboard | https://us.posthog.com |
| Google Analytics | https://analytics.google.com (Property: G-B7YB9725LR) |

---

*For questions, contact the engineering team or refer to the Meta Marketing API documentation.*
