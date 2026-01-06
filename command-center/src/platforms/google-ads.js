/**
 * Google Ads Platform Adapter
 *
 * Uses Google Ads API v18 for campaign management and reporting.
 * Requires Standard Access developer token for full functionality.
 */

const PLATFORM = 'Google';
const API_VERSION = 'v18';
const API_BASE = 'https://googleads.googleapis.com';

// Token cache
let accessToken = null;
let tokenExpiry = 0;

/**
 * Check if Google Ads is configured
 */
export function isConfigured() {
  return !!(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID
  );
}

/**
 * Get fresh access token
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`OAuth error: ${data.error_description || data.error}`);
  }

  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // 1 min buffer

  return accessToken;
}

/**
 * Execute GAQL query
 */
async function executeQuery(query) {
  const token = await getAccessToken();
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json'
  };

  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId;
  }

  const response = await fetch(
    `${API_BASE}/${API_VERSION}/customers/${customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    }
  );

  const data = await response.json();

  if (data.error || (Array.isArray(data) && data[0]?.error)) {
    const error = data.error || data[0].error;
    throw new Error(error.message || 'Google Ads API error');
  }

  return data;
}

/**
 * Get campaigns
 */
export async function getCampaigns(options = {}) {
  if (!isConfigured()) {
    console.warn('Google Ads not configured. See google-ads/SETUP.md');
    return [];
  }

  try {
    let whereClause = '';
    if (options.status === 'active') {
      whereClause = "WHERE campaign.status = 'ENABLED'";
    } else if (options.status === 'paused') {
      whereClause = "WHERE campaign.status = 'PAUSED'";
    }

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros
      FROM campaign
      ${whereClause}
      ORDER BY campaign.name
    `;

    const data = await executeQuery(query);

    // Flatten results from stream
    const campaigns = [];
    if (Array.isArray(data)) {
      data.forEach(chunk => {
        if (chunk.results) {
          chunk.results.forEach(result => {
            campaigns.push({
              id: result.campaign.id,
              name: result.campaign.name,
              status: result.campaign.status === 'ENABLED' ? 'active' : 'paused',
              platform: PLATFORM,
              budget: result.campaignBudget?.amountMicros
                ? result.campaignBudget.amountMicros / 1000000
                : null,
              type: result.campaign.advertisingChannelType
            });
          });
        }
      });
    }

    return campaigns;
  } catch (error) {
    console.error('Google Ads getCampaigns error:', error.message);
    return [];
  }
}

/**
 * Get insights for date range
 */
export async function getInsights(dateRange) {
  if (!isConfigured()) {
    return {
      platform: PLATFORM,
      spend: null,
      impressions: null,
      clicks: null,
      ctr: null,
      conversions: null,
      cpa: null,
      roas: null,
      error: 'Not configured'
    };
  }

  try {
    const query = `
      SELECT
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM customer
      WHERE segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
    `;

    const data = await executeQuery(query);

    // Aggregate metrics
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalCostMicros = 0;
    let totalConversions = 0;
    let totalConversionsValue = 0;

    if (Array.isArray(data)) {
      data.forEach(chunk => {
        if (chunk.results) {
          chunk.results.forEach(result => {
            totalImpressions += Number(result.metrics?.impressions || 0);
            totalClicks += Number(result.metrics?.clicks || 0);
            totalCostMicros += Number(result.metrics?.costMicros || 0);
            totalConversions += Number(result.metrics?.conversions || 0);
            totalConversionsValue += Number(result.metrics?.conversionsValue || 0);
          });
        }
      });
    }

    const spend = totalCostMicros / 1000000;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpa = totalConversions > 0 ? spend / totalConversions : 0;
    const roas = spend > 0 ? totalConversionsValue / spend : 0;

    return {
      platform: PLATFORM,
      spend,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr,
      conversions: totalConversions,
      cpa,
      roas
    };
  } catch (error) {
    return {
      platform: PLATFORM,
      spend: null,
      impressions: null,
      clicks: null,
      ctr: null,
      conversions: null,
      cpa: null,
      roas: null,
      error: error.message
    };
  }
}

/**
 * Update campaign status
 */
export async function updateCampaign(campaignId, updates) {
  if (!isConfigured()) {
    throw new Error('Google Ads not configured');
  }

  const token = await getAccessToken();
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json'
  };

  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId;
  }

  // Map status
  let status = updates.status;
  if (status === 'active') status = 'ENABLED';
  if (status === 'paused') status = 'PAUSED';

  const body = {
    operations: [{
      update: {
        resourceName: `customers/${customerId}/campaigns/${campaignId}`,
        status
      },
      updateMask: 'status'
    }]
  };

  const response = await fetch(
    `${API_BASE}/${API_VERSION}/customers/${customerId}/campaigns:mutate`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return { success: true, campaignId };
}

/**
 * Send offline conversion
 */
export async function sendConversion(event, userData = {}, customData = {}) {
  if (!isConfigured()) {
    return {
      success: false,
      platform: PLATFORM,
      error: 'Not configured'
    };
  }

  // Note: Google Ads requires GCLID for offline conversions
  // This is typically captured when user clicks an ad
  if (!customData.gclid) {
    return {
      success: false,
      platform: PLATFORM,
      error: 'GCLID required for Google Ads conversions'
    };
  }

  try {
    const token = await getAccessToken();
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      'Content-Type': 'application/json'
    };

    if (loginCustomerId) {
      headers['login-customer-id'] = loginCustomerId;
    }

    const conversionTime = new Date().toISOString().replace('T', ' ').replace('Z', '+00:00');

    const conversion = {
      gclid: customData.gclid,
      conversionAction: `customers/${customerId}/conversionActions/${customData.conversionActionId || event}`,
      conversionDateTime: conversionTime
    };

    if (customData.value) {
      conversion.conversionValue = customData.value;
      conversion.currencyCode = customData.currency || 'USD';
    }

    const body = {
      conversions: [conversion],
      partialFailure: true
    };

    const response = await fetch(
      `${API_BASE}/${API_VERSION}/customers/${customerId}:uploadClickConversions`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      success: true,
      platform: PLATFORM,
      results: data.results
    };
  } catch (error) {
    return {
      success: false,
      platform: PLATFORM,
      error: error.message
    };
  }
}

export default {
  isConfigured,
  getCampaigns,
  getInsights,
  updateCampaign,
  sendConversion
};
