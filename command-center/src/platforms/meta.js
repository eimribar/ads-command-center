import { createApiClient, sha256, generateEventId, handleApiError } from '../utils/api.js';

const PLATFORM = 'Meta';

/**
 * Get Meta API configuration from environment
 */
function getConfig() {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const pixelId = process.env.META_PIXEL_ID;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const apiVersion = process.env.META_API_VERSION || 'v21.0';

  if (!accessToken) {
    throw new Error('META_ACCESS_TOKEN not configured');
  }

  return { accessToken, pixelId, adAccountId, apiVersion };
}

/**
 * Create Meta API client
 */
function createClient() {
  const config = getConfig();
  return createApiClient(`https://graph.facebook.com/${config.apiVersion}`);
}

/**
 * Check if Meta is configured
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
 * Get campaigns from Meta Ads
 */
export async function getCampaigns() {
  const config = getConfig();
  const client = createClient();

  try {
    const response = await client.get(
      `/${config.adAccountId}/campaigns`,
      {
        params: {
          access_token: config.accessToken,
          fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time',
          limit: 50
        }
      }
    );

    return response.data.data.map(c => ({
      platform: 'Meta',
      id: c.id,
      name: c.name,
      status: c.status,
      objective: c.objective,
      budget: (c.daily_budget || c.lifetime_budget || 0) / 100, // Convert from cents
      createdAt: c.created_time
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
    const response = await client.get(
      `/${config.adAccountId}/insights`,
      {
        params: {
          access_token: config.accessToken,
          fields: 'spend,impressions,clicks,ctr,actions,cost_per_action_type,purchase_roas',
          time_range: JSON.stringify({
            since: dateRange.startDate,
            until: dateRange.endDate
          }),
          level: 'account'
        }
      }
    );

    const data = response.data.data[0] || {};

    // Extract conversions from actions
    let conversions = 0;
    if (data.actions) {
      const purchaseAction = data.actions.find(a => a.action_type === 'purchase');
      const leadAction = data.actions.find(a => a.action_type === 'lead');
      conversions = parseInt(purchaseAction?.value || 0) + parseInt(leadAction?.value || 0);
    }

    // Extract CPA
    let cpa = null;
    if (data.cost_per_action_type) {
      const purchaseCpa = data.cost_per_action_type.find(a => a.action_type === 'purchase');
      cpa = purchaseCpa ? parseFloat(purchaseCpa.value) : null;
    }

    // Extract ROAS
    let roas = null;
    if (data.purchase_roas && data.purchase_roas.length > 0) {
      roas = parseFloat(data.purchase_roas[0].value);
    }

    const spend = parseFloat(data.spend || 0);
    const impressions = parseInt(data.impressions || 0);
    const clicks = parseInt(data.clicks || 0);
    const ctr = parseFloat(data.ctr || 0);

    return {
      platform: 'Meta',
      spend,
      impressions,
      clicks,
      ctr,
      conversions,
      cpa: cpa || (conversions > 0 ? spend / conversions : null),
      roas
    };
  } catch (error) {
    handleApiError(error, PLATFORM);
  }
}

/**
 * Update campaign status
 */
export async function updateCampaign(campaignId, updates) {
  const config = getConfig();
  const client = createClient();

  try {
    const params = {
      access_token: config.accessToken
    };

    if (updates.status) {
      params.status = updates.status; // ACTIVE, PAUSED, DELETED
    }
    if (updates.dailyBudget) {
      params.daily_budget = Math.round(updates.dailyBudget * 100); // Convert to cents
    }

    const response = await client.post(`/${campaignId}`, null, { params });

    return {
      success: response.data.success !== false,
      message: 'Campaign updated'
    };
  } catch (error) {
    handleApiError(error, PLATFORM);
  }
}

/**
 * Send conversion event via CAPI
 */
export async function sendConversion(event, userData = {}, customData = {}) {
  const config = getConfig();
  const client = createClient();

  const eventId = generateEventId();
  const timestamp = Math.floor(Date.now() / 1000);

  const eventData = {
    event_name: event,
    event_time: timestamp,
    event_id: eventId,
    event_source_url: customData.url || 'https://www.agentss.ai',
    action_source: 'website',
    user_data: {}
  };

  // Add hashed user data
  if (userData.email) {
    eventData.user_data.em = [sha256(userData.email)];
  }
  if (userData.phone) {
    eventData.user_data.ph = [sha256(userData.phone)];
  }
  if (userData.firstName) {
    eventData.user_data.fn = [sha256(userData.firstName)];
  }
  if (userData.lastName) {
    eventData.user_data.ln = [sha256(userData.lastName)];
  }
  if (userData.ip) {
    eventData.user_data.client_ip_address = userData.ip;
  }
  if (userData.userAgent) {
    eventData.user_data.client_user_agent = userData.userAgent;
  }

  // Add custom data for purchase events
  if (event === 'Purchase' && customData.value) {
    eventData.custom_data = {
      currency: customData.currency || 'USD',
      value: customData.value
    };
    if (customData.orderId) {
      eventData.custom_data.order_id = customData.orderId;
    }
  }

  try {
    const response = await client.post(
      `/${config.pixelId}/events`,
      {
        data: [eventData]
      },
      {
        params: {
          access_token: config.accessToken
        }
      }
    );

    return {
      success: response.data.events_received === 1,
      eventId,
      message: `Received: ${response.data.events_received}`
    };
  } catch (error) {
    handleApiError(error, PLATFORM);
  }
}

/**
 * Get pixel statistics
 */
export async function getPixelStats() {
  const config = getConfig();
  const client = createClient();

  try {
    const response = await client.get(
      `/${config.pixelId}/stats`,
      {
        params: {
          access_token: config.accessToken,
          aggregation: 'event'
        }
      }
    );

    return response.data.data;
  } catch (error) {
    handleApiError(error, PLATFORM);
  }
}

export default {
  isConfigured,
  getCampaigns,
  getInsights,
  updateCampaign,
  sendConversion,
  getPixelStats
};
