import { createApiClient, sha256, generateEventId, handleApiError } from '../utils/api.js';

const PLATFORM = 'Reddit';

/**
 * Get Reddit API configuration from environment
 */
function getConfig() {
  const accessToken = process.env.REDDIT_ACCESS_TOKEN;
  const adAccountId = process.env.REDDIT_AD_ACCOUNT_ID;
  const pixelId = process.env.REDDIT_PIXEL_ID || adAccountId;

  if (!accessToken) {
    throw new Error('REDDIT_ACCESS_TOKEN not configured');
  }

  return { accessToken, adAccountId, pixelId };
}

/**
 * Create Reddit Ads API client
 */
function createClient() {
  const config = getConfig();
  return createApiClient('https://ads-api.reddit.com/api/v3', {
    'Authorization': `Bearer ${config.accessToken}`
  });
}

/**
 * Check if Reddit is configured
 */
export function isConfigured() {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get campaigns from Reddit Ads
 */
export async function getCampaigns() {
  const config = getConfig();
  const client = createClient();

  try {
    const response = await client.get(`/ad_accounts/${config.adAccountId}/campaigns`);

    return (response.data.data || []).map(c => ({
      platform: 'Reddit',
      id: c.id,
      name: c.name,
      status: c.effective_status || c.configured_status,
      objective: c.objective,
      budget: c.budget_total_amount_micros ? c.budget_total_amount_micros / 1000000 : 0,
      createdAt: c.created_at
    }));
  } catch (error) {
    handleApiError(error, PLATFORM);
  }
}

/**
 * Get insights/performance data
 */
export async function getInsights(dateRange) {
  const config = getConfig();
  const client = createClient();

  try {
    const response = await client.get(`/ad_accounts/${config.adAccountId}/reports`, {
      params: {
        starts_at: dateRange.startDate,
        ends_at: dateRange.endDate,
        time_zone: 'UTC',
        group_by: 'none'
      }
    });

    const data = response.data.data?.[0] || {};
    const spend = (data.spend_micros || 0) / 1000000;
    const impressions = parseInt(data.impressions || 0);
    const clicks = parseInt(data.clicks || 0);
    const conversions = parseInt(data.conversions || 0);

    return {
      platform: 'Reddit',
      spend,
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      conversions,
      cpa: conversions > 0 ? spend / conversions : null,
      roas: null // Reddit doesn't provide ROAS directly
    };
  } catch (error) {
    // If report fails, return zeros (might not have data)
    console.warn(`Reddit insights unavailable: ${error.message}`);
    return {
      platform: 'Reddit',
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      conversions: 0,
      cpa: null,
      roas: null
    };
  }
}

/**
 * Update campaign status
 */
export async function updateCampaign(campaignId, updates) {
  const config = getConfig();
  const client = createClient();

  try {
    const body = {};

    if (updates.status) {
      body.configured_status = updates.status; // ACTIVE, PAUSED
    }
    if (updates.dailyBudget) {
      body.budget_total_amount_micros = Math.round(updates.dailyBudget * 1000000);
    }

    const response = await client.patch(`/campaigns/${campaignId}`, body);

    return {
      success: true,
      message: 'Campaign updated'
    };
  } catch (error) {
    handleApiError(error, PLATFORM);
  }
}

/**
 * Send conversion event via Reddit CAPI
 */
export async function sendConversion(event, userData = {}, customData = {}) {
  const config = getConfig();
  const client = createClient();

  // Map standard events to Reddit event types
  const eventMap = {
    'Purchase': 'Purchase',
    'AddToCart': 'AddToCart',
    'Lead': 'Lead',
    'ViewContent': 'ViewContent',
    'PageVisit': 'PageVisit',
    'Search': 'Search',
    'SignUp': 'SignUp'
  };

  const eventType = eventMap[event] || event;
  const eventId = generateEventId();

  const conversionData = {
    events: [{
      event_at: new Date().toISOString(),
      event_type: {
        tracking_type: eventType
      },
      event_metadata: {
        item_count: 1,
        currency: customData.currency || 'USD',
        value_decimal: customData.value || 0
      }
    }]
  };

  // Add user matching data
  if (userData.email) {
    conversionData.events[0].user = {
      email: sha256(userData.email)
    };
  }

  // Add click ID if available
  if (userData.clickId) {
    conversionData.events[0].click_id = userData.clickId;
  }

  try {
    const response = await client.post(
      `/ad_accounts/${config.pixelId}/conversions`,
      conversionData
    );

    return {
      success: true,
      eventId,
      message: 'Conversion sent'
    };
  } catch (error) {
    handleApiError(error, PLATFORM);
  }
}

export default {
  isConfigured,
  getCampaigns,
  getInsights,
  updateCampaign,
  sendConversion
};
