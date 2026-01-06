# PLG Tracking — Team Responsibilities

---

# PRODUCT & ENGINEERING TEAM

### Your Job: Build the Tracking Infrastructure

Everything below involves writing code or changing the database. Marketing cannot do this — they depend on you.

---

## Phase 1: Foundation (Do First)

### Task 1: Choose Domain Structure
| What | Decide if product app will be on subdomain or separate domain |
|------|--------------------------------------------------------------|
| Options | `app.agentss.ai` (recommended) OR `myapp.com` (harder) |
| Impact | Determines how attribution data flows |
| Output | Decision documented and shared with team |

---

### Task 2: Add Meta Pixel to Product App
| What | Copy Meta Pixel JavaScript code into product app |
|------|--------------------------------------------------|
| Pixel ID | `2368446756922318` |
| Where | In `<head>` of your app's HTML (every page) |
| Code | Standard Meta Pixel init snippet |

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '2368446756922318');
fbq('track', 'PageView');
</script>
```

---

### Task 3: Add PostHog to Product App
| What | Add PostHog analytics to product app |
|------|--------------------------------------|
| API Key | `phc_JAlgbrIdqPf8VU1APqRCYzygOSSJR7eMZjybPSwwKUe` |
| Host | `https://us.posthog.com` |

```html
<script>
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('phc_JAlgbrIdqPf8VU1APqRCYzygOSSJR7eMZjybPSwwKUe',{api_host:'https://us.posthog.com'})
</script>
```

---

## Phase 2: Database (Do Second)

### Task 4: Add Attribution Columns to Users Table
| What | Store tracking data with each user |
|------|-----------------------------------|
| Why | Need this data when user purchases days/weeks later |

```sql
ALTER TABLE users ADD COLUMN fbc VARCHAR(255);
ALTER TABLE users ADD COLUMN fbp VARCHAR(255);
ALTER TABLE users ADD COLUMN utm_source VARCHAR(100);
ALTER TABLE users ADD COLUMN utm_medium VARCHAR(100);
ALTER TABLE users ADD COLUMN utm_campaign VARCHAR(255);
ALTER TABLE users ADD COLUMN utm_content VARCHAR(255);
ALTER TABLE users ADD COLUMN signup_event_id VARCHAR(100);
```

---

## Phase 3: Frontend Tracking (Do Third)

### Task 5: Create Tracking Utility
| What | JavaScript functions to fire tracking events |
|------|---------------------------------------------|
| Where | Shared utility file in your frontend app |

```javascript
// tracking.js

// Generate unique event ID for deduplication
function generateEventId(eventName) {
  return eventName + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

// Get cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Get URL parameter
function getUrlParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

// SIGNUP EVENT
export function trackSignUp(params = {}) {
  const eventId = generateEventId('CompleteRegistration');

  // Meta Pixel
  if (window.fbq) {
    fbq('track', 'CompleteRegistration', {
      content_name: params.method || 'email',
      status: 'registered'
    }, { eventID: eventId });
  }

  // PostHog
  if (window.posthog) {
    posthog.capture('user_signed_up', {
      event_id: eventId,
      signup_method: params.method,
      ...params
    });
  }

  return eventId;
}

// ONBOARDING STEP EVENT
export function trackOnboardingStep(stepNumber, stepName, totalSteps) {
  const eventId = generateEventId('OnboardingStep' + stepNumber);

  // PostHog (main use - funnel analysis)
  if (window.posthog) {
    posthog.capture('onboarding_step_completed', {
      event_id: eventId,
      step_number: stepNumber,
      step_name: stepName,
      total_steps: totalSteps
    });
  }

  return eventId;
}

// PURCHASE EVENT
export function trackPurchase(value, currency, planName) {
  const eventId = generateEventId('Purchase');

  // Meta Pixel
  if (window.fbq) {
    fbq('track', 'Purchase', {
      value: value,
      currency: currency || 'USD',
      content_name: planName,
      content_type: 'subscription'
    }, { eventID: eventId });
  }

  // PostHog
  if (window.posthog) {
    posthog.capture('subscription_created', {
      event_id: eventId,
      value: value,
      currency: currency || 'USD',
      plan_name: planName
    });
  }

  return eventId;
}

// Get attribution data (for passing to backend)
export function getAttribution() {
  return {
    fbc: getUrlParam('fbc') || getCookie('_fbc') || null,
    fbp: getUrlParam('fbp') || getCookie('_fbp') || null,
    utm_source: getUrlParam('utm_source') || null,
    utm_medium: getUrlParam('utm_medium') || null,
    utm_campaign: getUrlParam('utm_campaign') || null,
    utm_content: getUrlParam('utm_content') || null
  };
}
```

---

### Task 6: Implement Attribution Passing (Landing Page → App)
| What | Pass tracking cookies via URL when redirecting to signup |
|------|--------------------------------------------------------|
| Where | Landing page signup button |

```javascript
// On landing page, when user clicks "Sign Up" or "Get Started"
function redirectToSignup() {
  const fbc = getCookie('_fbc') || '';
  const fbp = getCookie('_fbp') || '';
  const params = new URLSearchParams(window.location.search);

  const signupUrl = new URL('https://app.agentss.ai/signup');
  signupUrl.searchParams.set('fbc', fbc);
  signupUrl.searchParams.set('fbp', fbp);
  signupUrl.searchParams.set('utm_source', params.get('utm_source') || '');
  signupUrl.searchParams.set('utm_medium', params.get('utm_medium') || '');
  signupUrl.searchParams.set('utm_campaign', params.get('utm_campaign') || '');

  window.location.href = signupUrl.toString();
}
```

---

### Task 7: Call Tracking in Signup Flow
| What | Fire events and pass data to backend |
|------|-------------------------------------|
| Where | Signup form submission |

```javascript
// In your signup form component
import { trackSignUp, getAttribution } from './tracking';

async function handleSignup(email, password) {
  // 1. Fire browser-side event, get event ID
  const eventId = trackSignUp({ method: 'email' });

  // 2. Get attribution data
  const attribution = getAttribution();

  // 3. Send to backend (include everything!)
  const response = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      eventId,           // For CAPI deduplication
      ...attribution     // fbc, fbp, utm_*
    })
  });

  // 4. Identify user in PostHog
  const user = await response.json();
  if (window.posthog) {
    posthog.identify(user.id, {
      email: user.email,
      signup_source: attribution.utm_source
    });
  }
}
```

---

### Task 8: Call Tracking in Onboarding
| What | Fire event at each onboarding step |
|------|-----------------------------------|
| Where | Each onboarding step component |

```javascript
import { trackOnboardingStep } from './tracking';

// Call when user completes each step
function onStepComplete(stepNumber, stepName) {
  trackOnboardingStep(stepNumber, stepName, 5); // 5 = total steps
}

// Example usage:
onStepComplete(1, 'profile_setup');
onStepComplete(2, 'connect_email');
onStepComplete(3, 'import_contacts');
onStepComplete(4, 'configure_ai');
onStepComplete(5, 'choose_plan');
```

---

### Task 9: Call Tracking at Purchase
| What | Fire event when user initiates payment |
|------|---------------------------------------|
| Where | Checkout/payment component |

```javascript
import { trackPurchase } from './tracking';

function handlePayment(planName, price) {
  // Fire browser event before redirecting to Stripe
  const eventId = trackPurchase(price, 'USD', planName);

  // Store eventId to pass to backend if needed
  sessionStorage.setItem('purchase_event_id', eventId);

  // Redirect to Stripe checkout...
}
```

---

## Phase 4: Backend (Do Fourth)

### Task 10: Create CAPI Module
| What | Server-side function to send events to Facebook |
|------|------------------------------------------------|
| Where | Backend utility file |

```javascript
// meta-capi.js
const crypto = require('crypto');

const PIXEL_ID = '2368446756922318';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN; // From .env

function sha256(value) {
  if (!value) return undefined;
  return crypto.createHash('sha256')
    .update(value.toLowerCase().trim())
    .digest('hex');
}

async function sendMetaEvent(eventName, userData, customData = {}) {
  const eventData = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: customData.eventId || `${eventName}_${Date.now()}`,
    event_source_url: customData.url || 'https://app.agentss.ai',
    action_source: 'website',
    user_data: {
      em: userData.email ? [sha256(userData.email)] : undefined,
      fn: userData.firstName ? [sha256(userData.firstName)] : undefined,
      ln: userData.lastName ? [sha256(userData.lastName)] : undefined,
      ph: userData.phone ? [sha256(userData.phone.replace(/\D/g, ''))] : undefined,
      fbc: userData.fbc || undefined,
      fbp: userData.fbp || undefined,
      client_ip_address: userData.ip,
      client_user_agent: userData.userAgent
    }
  };

  // Add value for purchase events
  if (customData.value) {
    eventData.custom_data = {
      currency: customData.currency || 'USD',
      value: parseFloat(customData.value)
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [eventData] })
      }
    );

    const result = await response.json();
    console.log(`[CAPI] ${eventName}:`, result);
    return result;
  } catch (error) {
    console.error(`[CAPI] ${eventName} failed:`, error);
    throw error;
  }
}

module.exports = { sendMetaEvent };
```

---

### Task 11: Update Signup API Route
| What | Store attribution + send CAPI event |
|------|-------------------------------------|
| Where | Your signup API endpoint |

```javascript
// routes/auth.js or similar
const { sendMetaEvent } = require('./meta-capi');

app.post('/api/signup', async (req, res) => {
  const { email, password, eventId, fbc, fbp, utm_source, utm_medium, utm_campaign } = req.body;

  // 1. Create user in database WITH attribution data
  const user = await db.users.create({
    email,
    password: await hashPassword(password),
    fbc,                    // STORE THIS!
    fbp,                    // STORE THIS!
    utm_source,             // STORE THIS!
    utm_medium,
    utm_campaign,
    signup_event_id: eventId
  });

  // 2. Send server-side event to Facebook
  await sendMetaEvent('CompleteRegistration', {
    email: user.email,
    fbc,
    fbp,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  }, {
    eventId,  // SAME as browser event ID!
    url: req.headers.referer || 'https://app.agentss.ai/signup'
  });

  res.json({ success: true, userId: user.id });
});
```

---

### Task 12: Implement Stripe Webhook for Purchase
| What | Send Purchase event when payment succeeds |
|------|------------------------------------------|
| Where | Stripe webhook handler |
| Why | Most critical event — this is your revenue! |

```javascript
// routes/webhooks/stripe.js
const { sendMetaEvent } = require('./meta-capi');

app.post('/webhooks/stripe', async (req, res) => {
  const event = req.body;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // 1. Get user and their STORED attribution data
    const user = await db.users.findOne({
      where: { stripeCustomerId: session.customer }
    });

    // 2. Send Purchase event with stored attribution!
    await sendMetaEvent('Purchase', {
      email: user.email,
      fbc: user.fbc,      // Retrieved from database!
      fbp: user.fbp,      // Retrieved from database!
    }, {
      value: session.amount_total / 100,  // Convert cents to dollars
      currency: session.currency.toUpperCase(),
      eventId: `purchase_${session.id}`
    });

    // 3. Update user record
    await db.users.update(
      { hasPaid: true, plan: session.metadata.plan },
      { where: { id: user.id } }
    );
  }

  res.json({ received: true });
});
```

---

## Phase 5: Testing (Do Last)

### Task 13: Test the Full Flow
| What | Verify everything works end-to-end |
|------|-----------------------------------|
| How | Use Meta's Test Events tool |

**Steps:**
1. Go to [Events Manager](https://business.facebook.com/events_manager2/list/pixel/2368446756922318)
2. Click "Test Events" tab
3. Enter your app URL
4. Do a test signup
5. Verify `CompleteRegistration` appears (should show "Browser" AND "Server")
6. Do a test purchase
7. Verify `Purchase` appears with correct value

---

## Deliverables Checklist for Engineering

| # | Task | Status |
|---|------|--------|
| 1 | Domain decision made | ⬜ |
| 2 | Meta Pixel added to app | ⬜ |
| 3 | PostHog added to app | ⬜ |
| 4 | Database columns added | ⬜ |
| 5 | Frontend tracking utility created | ⬜ |
| 6 | Attribution passing implemented | ⬜ |
| 7 | Signup tracking implemented | ⬜ |
| 8 | Onboarding step tracking implemented | ⬜ |
| 9 | Purchase tracking implemented | ⬜ |
| 10 | CAPI module created | ⬜ |
| 11 | Signup API stores attribution + sends CAPI | ⬜ |
| 12 | Stripe webhook sends Purchase CAPI | ⬜ |
| 13 | Full flow tested | ⬜ |

**Hand off to Marketing when all boxes checked**

---
---
---

# MARKETING TEAM

### Your Job: Configure Meta & PostHog, Monitor Performance

Everything below is done in Facebook/PostHog UI. No code required. You depend on Engineering completing their tasks first.

---

## Prerequisites (Wait for Engineering)

Before you can do your tasks, Engineering must complete:
- Pixel installed on product app
- Events firing (CompleteRegistration, Purchase)
- PostHog installed and events flowing

**How to verify:** Go to Events Manager - You should see test events appearing.

---

## Phase 1: Meta Events Manager Setup

### Task 1: Verify Events Are Being Received
| What | Confirm events are flowing into Facebook |
|------|------------------------------------------|
| Where | [Events Manager](https://business.facebook.com/events_manager2/list/pixel/2368446756922318) |

**Steps:**
1. Go to Events Manager
2. Select pixel "Agentss Pixel" (2368446756922318)
3. Click "Overview" tab
4. You should see:
   - `PageView` events
   - `CompleteRegistration` events
   - `Purchase` events (after test purchases)

**Check Event Match Quality:**
- Click on any event
- Look for "Event Match Quality" score
- Target: **6.0 or higher**
- If low: Tell Engineering to add more user data (email, phone)

---

### Task 2: Create Custom Conversion — Sign Up
| What | Tell Facebook "this event is a signup" for optimization |
|------|--------------------------------------------------------|
| Where | Events Manager - Custom Conversions |

**Steps:**
1. Go to Events Manager
2. Click "Custom Conversions" in left sidebar
3. Click "Create Custom Conversion"
4. Configure:
   - **Name:** `Agentss Sign Up`
   - **Data Source:** Agentss Pixel (2368446756922318)
   - **Event:** `CompleteRegistration`
   - **Category:** Lead / Registration
5. Click "Create"

---

### Task 3: Create Custom Conversion — Purchase
| What | Tell Facebook "this event is a purchase with value" |
|------|---------------------------------------------------|
| Where | Events Manager - Custom Conversions |

**Steps:**
1. Click "Create Custom Conversion"
2. Configure:
   - **Name:** `Agentss Purchase`
   - **Data Source:** Agentss Pixel (2368446756922318)
   - **Event:** `Purchase`
   - **Category:** Purchase
   - **Value:** Include value (Facebook will read `value` from event)
3. Click "Create"

---

### Task 4: Verify Deduplication is Working
| What | Confirm browser and server events aren't being double-counted |
|------|-------------------------------------------------------------|
| Where | Events Manager - Overview |

**How to check:**
1. Click on `CompleteRegistration` event
2. Look at "Connection Method" breakdown
3. You should see:
   - Some events from "Browser"
   - Some events from "Server"
   - Total count should match actual signups (not 2x)

If counts seem doubled: Tell Engineering their event IDs might not be matching.

---

## Phase 2: Campaign Optimization Setup

### Task 5: Configure Campaign for Sign Up Optimization
| What | Tell Facebook to find people likely to sign up |
|------|-----------------------------------------------|
| Where | Ads Manager - Campaign Settings |

**When creating/editing campaigns:**
1. Campaign Objective: **Leads** or **Conversions**
2. Conversion Event: Select `Agentss Sign Up` (your custom conversion)
3. Optimization: "Conversions"

**Use this when:** You want more signups (top of funnel)

---

### Task 6: Configure Campaign for Purchase Optimization
| What | Tell Facebook to find people likely to pay |
|------|-------------------------------------------|
| Where | Ads Manager - Campaign Settings |

**When creating/editing campaigns:**
1. Campaign Objective: **Sales** or **Conversions**
2. Conversion Event: Select `Agentss Purchase` (your custom conversion)
3. Optimization: "Conversions" or "Value" (maximize revenue)

**Use this when:**
- You have 50+ purchases per week
- You want to maximize revenue (not just signups)

---

### Task 7: Set Up Value-Based Lookalike Audience
| What | Create audience of people similar to paying customers |
|------|-----------------------------------------------------|
| Where | Audiences - Create Audience |

**Steps:**
1. Go to Audiences in Ads Manager
2. Create Audience - Custom Audience
3. Source: Website
4. Event: Purchase
5. Retention: 180 days
6. Save

Then:
1. Create Audience - Lookalike Audience
2. Source: Your Purchase custom audience
3. Location: Your target countries
4. Size: Start with 1% (most similar)

---

## Phase 3: PostHog Setup

### Task 8: Create Signup → Purchase Funnel
| What | Visualize where users drop off |
|------|-------------------------------|
| Where | [PostHog](https://us.posthog.com) - Funnels |

**Steps:**
1. Log into PostHog
2. Go to "Funnels" (or Insights - New - Funnel)
3. Add steps in order:
   - Step 1: `user_signed_up`
   - Step 2: `onboarding_step_completed` (filter: step_number = 1)
   - Step 3: `onboarding_step_completed` (filter: step_number = 2)
   - Step 4: `onboarding_step_completed` (filter: step_number = 3)
   - Step 5: `onboarding_step_completed` (filter: step_number = 4)
   - Step 6: `subscription_created`
4. Save as "PLG Conversion Funnel"

**What you'll see:**
```
100 users signed up
 └─ 80 completed step 1 (80%)
     └─ 60 completed step 2 (75%)
         └─ 30 completed step 3 (50%)  ← BIG DROP HERE!
             └─ 25 completed step 4 (83%)
                 └─ 10 purchased (40%)
```

This tells you: Step 3 is the problem. Investigate why!

---

### Task 9: Create "Signed Up But Didn't Pay" Cohort
| What | Identify users to retarget or email |
|------|-----------------------------------|
| Where | PostHog - Cohorts |

**Steps:**
1. Go to Cohorts - New Cohort
2. Configure:
   - **Matching:** Users who...
   - Did event: `user_signed_up`
   - AND did NOT do event: `subscription_created`
   - In the last: 30 days
3. Save as "Signed Up - No Purchase (30d)"

**Use this for:**
- Email campaigns to convert them
- Facebook retargeting audience
- Understanding why they didn't pay

---

### Task 10: Create "Dropped During Onboarding" Cohort
| What | Find users who got stuck |
|------|-------------------------|
| Where | PostHog - Cohorts |

**Steps:**
1. New Cohort
2. Configure:
   - Did event: `user_signed_up`
   - AND did event: `onboarding_step_completed` (step_number = 1)
   - AND did NOT do event: `onboarding_step_completed` (step_number = 2)
   - In the last: 14 days
3. Save as "Stuck at Onboarding Step 1"

Repeat for each step transition you want to analyze.

---

### Task 11: Set Up Conversion Rate Alert
| What | Get notified if conversion drops |
|------|--------------------------------|
| Where | PostHog - Data Management - Actions or Alerts |

**What to monitor:**
- Signup - Purchase rate drops below X%
- Weekly purchase count drops 20%+

---

## Phase 4: Ongoing Monitoring

### Weekly Tasks

| Task | Where | What to Look For |
|------|-------|------------------|
| Check Event Match Quality | Events Manager | Should be 6.0+ |
| Review funnel conversion | PostHog Funnel | Any steps with big drops? |
| Check campaign ROAS | Ads Manager | Purchases / Spend |
| Review "No Purchase" cohort size | PostHog | Growing = problem |

### Monthly Tasks

| Task | Where | What to Do |
|------|-------|-----------|
| Refresh lookalike audiences | Ads Manager | Update with recent purchasers |
| Analyze onboarding dropoffs | PostHog | Share findings with Product |
| Review attribution paths | PostHog | Which UTM sources convert best? |

---

## Deliverables Checklist for Marketing

| # | Task | Status |
|---|------|--------|
| 1 | Verify events in Events Manager | ⬜ |
| 2 | Create "Agentss Sign Up" custom conversion | ⬜ |
| 3 | Create "Agentss Purchase" custom conversion | ⬜ |
| 4 | Verify deduplication working | ⬜ |
| 5 | Configure signup optimization campaign | ⬜ |
| 6 | Configure purchase optimization campaign | ⬜ |
| 7 | Create value-based lookalike audience | ⬜ |
| 8 | Create PostHog conversion funnel | ⬜ |
| 9 | Create "No Purchase" cohort | ⬜ |
| 10 | Create "Stuck Onboarding" cohorts | ⬜ |
| 11 | Set up conversion alerts | ⬜ |

---

## Quick Reference for Marketing

| Resource | URL |
|----------|-----|
| Events Manager | https://business.facebook.com/events_manager2/list/pixel/2368446756922318 |
| Ads Manager | https://business.facebook.com/adsmanager/manage/campaigns?act=1182258557370297 |
| PostHog | https://us.posthog.com |

| Credential | Value |
|------------|-------|
| Pixel ID | 2368446756922318 |
| Ad Account | act_1182258557370297 |
| PostHog Project | phc_JAlgbrIdqPf8VU1APqRCYzygOSSJR7eMZjybPSwwKUe |

---

## Handoff Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        DEPENDENCY FLOW                          │
└─────────────────────────────────────────────────────────────────┘

ENGINEERING                              MARKETING
───────────                              ─────────

1. Add Pixel to app          ────────►   Can verify events
2. Add PostHog to app        ────────►   Can see analytics
3. Implement tracking code   ────────►   Can see specific events
4. Test full flow            ────────►   Can create custom conversions
                                         Can set up campaigns
                                         Can build funnels
                                         Can create cohorts
```

**Engineering blocks Marketing.** Marketing cannot configure anything until events are flowing.

---

## Documents in This Project

| Document | Purpose |
|----------|---------|
| `META_ADS_STRATEGY.md` | Executive overview of Meta tracking architecture |
| `PLG_TRACKING_REQUIREMENTS.md` | Detailed implementation guide with all code |
| `PLG_TEAM_RESPONSIBILITIES.md` | This document - team task breakdown |
| `.env` | All credentials (never commit to git!) |

---

*Last Updated: January 5, 2026*
