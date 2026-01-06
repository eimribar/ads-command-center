# Agentss AI — PLG Tracking Configuration Guide
## Requirements for Product-Led Growth Implementation

**Last Updated:** January 5, 2026
**Status:** Ready for implementation when product is built

---

## 1. PLG Funnel Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PLG CONVERSION FUNNEL                             │
└─────────────────────────────────────────────────────────────────────────────┘

  Ad Click     Landing      Sign Up    Onboarding    Purchase    Activation
     │          Page           │         Steps          │            │
     │            │            │           │            │            │
     ▼            ▼            ▼           ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌───────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  fbclid │ │PageView │ │ Complete  │ │ Steps   │ │Purchase │ │  Lead   │
│  UTM    │ │         │ │Registration│ │  1→N   │ │         │ │(custom) │
│  _fbc   │ │         │ │           │ │         │ │ $value  │ │         │
│  _fbp   │ │         │ │           │ │         │ │         │ │         │
└─────────┘ └─────────┘ └───────────┘ └─────────┘ └─────────┘ └─────────┘
     │            │            │           │            │            │
     └────────────┴────────────┴───────────┴────────────┴────────────┘
                              │
                    Attribution must flow through
                    entire funnel (fbc/fbp/UTM)
```

---

## 2. Events to Implement

### Meta Standard Events (for ad optimization)

| Stage | Meta Event | Fire When | Parameters |
|-------|------------|-----------|------------|
| Sign Up | `CompleteRegistration` | User creates account | `content_name`, `status` |
| Onboarding Done | `StartTrial` | User completes onboarding | — |
| Purchase | `Purchase` | Payment successful | `value`, `currency`, `content_name` |
| Activation | `Lead` | First value action | `content_name`, `content_category` |

### Custom Events (for PostHog analytics)

| Event | Fire When | Key Properties |
|-------|-----------|----------------|
| `onboarding_step_completed` | Each onboarding step | `step_number`, `step_name`, `total_steps` |
| `user_signed_up` | Account created | `signup_method`, `utm_source` |
| `onboarding_completed` | All steps done | `time_to_complete` |
| `subscription_created` | Payment confirmed | `value`, `plan_name` |
| `user_activated` | First value moment | `activation_action` |

---

## 3. Implementation Code

### 3.1 Browser-Side Tracking Functions

Add these to `AgentssAds` object in the product app:

```javascript
// ============================================
// SIGN UP TRACKING
// ============================================
window.AgentssAds.trackSignUp = function(params) {
  var eventId = this.getEventId('CompleteRegistration');

  // Meta Pixel
  this.trackMeta('CompleteRegistration', {
    content_name: params.signup_method || 'email',
    status: 'registered'
  }, { eventId: eventId });

  // PostHog
  this.trackPostHog('user_signed_up', Object.assign({
    event_id: eventId
  }, params));

  return eventId;
};

// ============================================
// ONBOARDING STEP TRACKING
// ============================================
window.AgentssAds.trackOnboardingStep = function(stepNumber, stepName, params) {
  params = params || {};
  var eventId = this.getEventId('OnboardingStep' + stepNumber);

  // Meta (custom event for analytics)
  this.trackMeta('OnboardingStep', {
    content_name: stepName,
    content_category: 'onboarding',
    step_number: stepNumber,
    total_steps: params.totalSteps || null
  }, { eventId: eventId });

  // PostHog (for funnel analysis)
  this.trackPostHog('onboarding_step_completed', {
    event_id: eventId,
    step_number: stepNumber,
    step_name: stepName,
    total_steps: params.totalSteps,
    time_on_step: params.timeOnStep
  });

  return eventId;
};

// ============================================
// ONBOARDING COMPLETE
// ============================================
window.AgentssAds.trackOnboardingComplete = function(params) {
  var eventId = this.getEventId('StartTrial');

  this.trackMeta('StartTrial', params, { eventId: eventId });
  this.trackPostHog('onboarding_completed', Object.assign({
    event_id: eventId
  }, params));

  return eventId;
};

// ============================================
// PURCHASE (at paywall)
// ============================================
window.AgentssAds.trackPurchase = function(params) {
  var eventId = this.getEventId('Purchase');

  this.trackMeta('Purchase', {
    value: params.value,
    currency: params.currency || 'USD',
    content_name: params.plan_name,
    content_type: 'subscription'
  }, { eventId: eventId });

  this.trackPostHog('subscription_created', Object.assign({
    event_id: eventId
  }, params));

  return eventId;
};

// ============================================
// ACTIVATION (first value moment)
// ============================================
window.AgentssAds.trackActivation = function(params) {
  var eventId = this.getEventId('Activation');

  this.trackMeta('Lead', {
    content_name: 'product_activation',
    content_category: params.activation_action
  }, { eventId: eventId });

  this.trackPostHog('user_activated', Object.assign({
    event_id: eventId
  }, params));

  return eventId;
};
```

### 3.2 Server-Side CAPI Integration

```javascript
// meta-capi.js - Server-side event sender
const crypto = require('crypto');

const META_PIXEL_ID = process.env.META_PIXEL_ID;        // 2368446756922318
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN; // EAAMazCSDU8wBQ...

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function sendMetaEvent(eventName, userData, customData) {
  const eventData = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: customData.eventId,  // MUST match browser eventId for dedup
    event_source_url: customData.url || 'https://agentss.ai',
    action_source: 'website',
    user_data: {
      em: userData.email ? [sha256(userData.email.toLowerCase().trim())] : undefined,
      ph: userData.phone ? [sha256(userData.phone.replace(/\D/g, ''))] : undefined,
      fn: userData.firstName ? [sha256(userData.firstName.toLowerCase().trim())] : undefined,
      ln: userData.lastName ? [sha256(userData.lastName.toLowerCase().trim())] : undefined,
      fbc: userData.fbc,   // Pass through from signup
      fbp: userData.fbp,   // Pass through from signup
      client_ip_address: userData.ip,
      client_user_agent: userData.userAgent
    }
  };

  // Add purchase value if applicable
  if (customData.value) {
    eventData.custom_data = {
      currency: customData.currency || 'USD',
      value: parseFloat(customData.value)
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [eventData],
          access_token: META_ACCESS_TOKEN
        })
      }
    );

    const result = await response.json();
    console.log(`[CAPI] ${eventName} sent:`, result);
    return result;
  } catch (error) {
    console.error(`[CAPI] ${eventName} failed:`, error);
    throw error;
  }
}

// Export for use in routes/webhooks
module.exports = { sendMetaEvent, sha256 };
```

### 3.3 Example Usage in Backend

```javascript
// routes/auth.js - On signup
app.post('/api/signup', async (req, res) => {
  const { email, password, fbc, fbp, utm } = req.body;

  // Create user in DB
  const user = await createUser({ email, password });

  // Store attribution data with user
  await storeUserAttribution(user.id, { fbc, fbp, utm });

  // Send CAPI event
  await sendMetaEvent('CompleteRegistration', {
    email: user.email,
    fbc,
    fbp,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  }, {
    eventId: req.body.eventId, // Passed from browser
    url: req.headers.referer
  });

  res.json({ success: true, userId: user.id });
});

// webhooks/stripe.js - On payment
app.post('/webhooks/stripe', async (req, res) => {
  const event = req.body;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const user = await getUserByStripeCustomer(session.customer);
    const attribution = await getUserAttribution(user.id);

    await sendMetaEvent('Purchase', {
      email: user.email,
      fbc: attribution.fbc,
      fbp: attribution.fbp
    }, {
      eventId: generateEventId('Purchase'),
      value: session.amount_total / 100,
      currency: session.currency.toUpperCase()
    });
  }

  res.json({ received: true });
});
```

---

## 4. Attribution Preservation

### Critical: Store These With Every User

When a user signs up, store these values in your database:

| Field | Source | Purpose |
|-------|--------|---------|
| `fbc` | Cookie `_fbc` or URL param | Facebook Click ID |
| `fbp` | Cookie `_fbp` | Facebook Browser ID |
| `utm_source` | URL param | Ad platform (facebook, google, etc.) |
| `utm_medium` | URL param | Traffic type (cpc, social, etc.) |
| `utm_campaign` | URL param | Campaign name |
| `utm_content` | URL param | Ad variant |
| `utm_term` | URL param | Keyword (if applicable) |

### Passing Attribution During Signup

```javascript
// On landing page, before redirect to signup
function goToSignup() {
  const params = new URLSearchParams({
    fbc: AgentssAds.fbc || '',
    fbp: AgentssAds.fbp || '',
    utm_source: AgentssAds.utm.source || '',
    utm_medium: AgentssAds.utm.medium || '',
    utm_campaign: AgentssAds.utm.campaign || '',
    utm_content: AgentssAds.utm.content || ''
  });

  window.location.href = '/signup?' + params.toString();
}
```

```javascript
// In signup form, capture and include in submission
const urlParams = new URLSearchParams(window.location.search);
const attributionData = {
  fbc: urlParams.get('fbc') || getCookie('_fbc'),
  fbp: urlParams.get('fbp') || getCookie('_fbp'),
  utm_source: urlParams.get('utm_source'),
  utm_medium: urlParams.get('utm_medium'),
  utm_campaign: urlParams.get('utm_campaign')
};

// Include in signup API call
fetch('/api/signup', {
  method: 'POST',
  body: JSON.stringify({
    email,
    password,
    ...attributionData,
    eventId: AgentssAds.getEventId('CompleteRegistration')
  })
});
```

---

## 5. PostHog User Identification

```javascript
// After successful signup, identify the user
posthog.identify(user.id, {
  email: user.email,
  name: user.name,
  signup_date: new Date().toISOString(),
  signup_source: utm.source,
  signup_campaign: utm.campaign,
  plan: 'free'
});

// On plan upgrade
posthog.people.set({
  plan: 'pro',
  plan_value: 99,
  upgraded_at: new Date().toISOString()
});
```

---

## 6. Onboarding Funnel Analysis

### Example Onboarding Flow

```javascript
// Step 1: Profile setup
AgentssAds.trackOnboardingStep(1, 'profile_setup', { totalSteps: 5 });

// Step 2: Connect email
AgentssAds.trackOnboardingStep(2, 'connect_email', { totalSteps: 5 });

// Step 3: Import contacts
AgentssAds.trackOnboardingStep(3, 'import_contacts', { totalSteps: 5 });

// Step 4: Configure AI
AgentssAds.trackOnboardingStep(4, 'configure_ai', { totalSteps: 5 });

// Step 5: Choose plan (paywall)
AgentssAds.trackPurchase({
  value: 99,
  currency: 'USD',
  plan_name: 'pro_monthly'
});

// After purchase - track activation
AgentssAds.trackOnboardingComplete({ steps_completed: 5 });
```

### PostHog Funnel Setup

Create a funnel in PostHog with these events in order:
1. `user_signed_up`
2. `onboarding_step_completed` (step_number = 1)
3. `onboarding_step_completed` (step_number = 2)
4. `onboarding_step_completed` (step_number = 3)
5. `onboarding_step_completed` (step_number = 4)
6. `subscription_created`

This will show you exactly where users drop off.

---

## 7. Meta Campaign Optimization Strategy

| Funnel Stage | Optimize Campaigns For | Expected Cost |
|--------------|----------------------|---------------|
| Awareness | `PageView` | Lowest CPA |
| Consideration | `CompleteRegistration` | Medium CPA |
| Conversion | `Purchase` | Highest CPA, best ROI |

**Recommendation:** Start by optimizing for `CompleteRegistration` (signups) until you have 50+ purchases/week, then switch to optimizing for `Purchase`.

---

## 8. Implementation Checklist

### Before Launch

- [ ] **Domain:** Decide on `app.agentss.ai` (recommended) or separate domain
- [ ] **Pixel:** Add Meta Pixel (ID: `2368446756922318`) to product app
- [ ] **PostHog:** Add PostHog (key: `phc_JAlgbrIdqPf8VU1APqRCYzygOSSJR7eMZjybPSwwKUe`)
- [ ] **Attribution:** Implement fbc/fbp/UTM passing from landing page to signup

### Backend

- [ ] **User Table:** Add columns for `fbc`, `fbp`, `utm_source`, `utm_medium`, `utm_campaign`
- [ ] **Signup Route:** Store attribution data with user
- [ ] **CAPI Module:** Implement `sendMetaEvent` function
- [ ] **Stripe Webhook:** Send `Purchase` event on payment success

### Events Manager

- [ ] **Custom Conversion:** Create "Agentss Sign Up" for `CompleteRegistration`
- [ ] **Custom Conversion:** Create "Agentss Purchase" for `Purchase` with value
- [ ] **Test Events:** Verify events appear in Test Events tool
- [ ] **Event Match Quality:** Target score > 6.0

### PostHog

- [ ] **Funnel:** Create signup → onboarding → purchase funnel
- [ ] **Cohort:** Users who signed up but didn't complete onboarding
- [ ] **Cohort:** Users who completed onboarding but didn't purchase
- [ ] **Alert:** Conversion rate drop > 20%

---

## 9. Credentials to Use

```bash
# Meta Pixel & CAPI
META_PIXEL_ID=2368446756922318
META_ACCESS_TOKEN=EAAMazCSDU8wBQdBl75PQR2ZA3pk6tkdQ9uEceAUP1qIsIxvO7drHaxi5PzYF1LQ7cJJUxVLpWUth8Ve728zgyzyjP4LTmvy9PwU5eNj6iMuzjJHC2cc61AXgLNcxooDYbZB5sfpopzFcMxuwylksH5DAijT40UZBQSDegKjnVTf7yKv3hICX4ilxsaxgAZDZD
META_API_VERSION=v21.0

# PostHog
POSTHOG_PROJECT_API_KEY=phc_JAlgbrIdqPf8VU1APqRCYzygOSSJR7eMZjybPSwwKUe
POSTHOG_HOST=https://us.posthog.com
```

---

*This document should be referenced when building the PLG product. All credentials are already configured and verified in the Agentss ads command center.*
