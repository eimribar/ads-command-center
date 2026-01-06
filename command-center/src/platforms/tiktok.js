/**
 * TikTok Ads Platform Adapter
 *
 * Uses TikTok Marketing API v1.3 for campaign management and Events API for conversions.
 * API Docs: https://business-api.tiktok.com/portal/docs
 */

import { sha256, generateEventId } from '../utils/api.js';

const PLATFORM = 'TikTok';
const API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

/**
 * Check if TikTok is configured
 */
export function isConfigured() {
  return !!(
    process.env.TIKTOK_ACCESS_TOKEN &&
    process.env.TIKTOK_ADVERTISER_ID
  );
}

/**
 * Make API request to TikTok
 */
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Access-Token': process.env.TIKTOK_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(data.message || 'TikTok API error');
  }

  return data;
}

/**
 * Get campaigns
 */
export async function getCampaigns(options = {}) {
  if (!isConfigured()) {
    console.warn('TikTok Ads not configured. See tiktok-ads/SETUP.md');
    return [];
  }

  try {
    const advertiserId = process.env.TIKTOK_ADVERTISER_ID;
    let url = `/campaign/get/?advertiser_id=${advertiserId}`;

    // Add status filter
    if (options.status === 'active') {
      url += '&filtering={"primary_status":"STATUS_ENABLE"}';
    } else if (options.status === 'paused') {
      url += '&filtering={"primary_status":"STATUS_DISABLE"}';
    }

    const data = await makeRequest(url);

    if (!data.data?.list) {
      return [];
    }

    return data.data.list.map(campaign => ({
      id: campaign.campaign_id,
      name: campaign.campaign_name,
      status: campaign.operation_status === 'ENABLE' ? 'active' : 'paused',
      platform: PLATFORM,
      budget: campaign.budget ? parseFloat(campaign.budget) : null,
      objective: campaign.objective_type
    }));
  } catch (error) {
    console.error('TikTok getCampaigns error:', error.message);
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
    const advertiserId = process.env.TIKTOK_ADVERTISER_ID;
    const metrics = encodeURIComponent(JSON.stringify([
      'spend', 'impressions', 'clicks', 'ctr',
      'conversion', 'cost_per_conversion',
      'total_complete_payment_value'
    ]));
    const dimensions = encodeURIComponent(JSON.stringify(['stat_time_day']));

    const url = `/report/integrated/get/?advertiser_id=${advertiserId}&report_type=BASIC&dimensions=${dimensions}&data_level=AUCTION_ADVERTISER&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}&metrics=${metrics}`;

    const data = await makeRequest(url);

    // Aggregate metrics from all days
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalConversionValue = 0;

    if (data.data?.list) {
      data.data.list.forEach(row => {
        const metrics = row.metrics || {};
        totalSpend += parseFloat(metrics.spend || 0);
        totalImpressions += parseInt(metrics.impressions || 0);
        totalClicks += parseInt(metrics.clicks || 0);
        totalConversions += parseFloat(metrics.conversion || 0);
        totalConversionValue += parseFloat(metrics.total_complete_payment_value || 0);
      });
    }

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const roas = totalSpend > 0 ? totalConversionValue / totalSpend : 0;

    return {
      platform: PLATFORM,
      spend: totalSpend,
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
    throw new Error('TikTok Ads not configured');
  }

  // Map status
  let operationStatus = updates.status;
  if (operationStatus === 'active') operationStatus = 'ENABLE';
  if (operationStatus === 'paused') operationStatus = 'DISABLE';

  const body = {
    advertiser_id: process.env.TIKTOK_ADVERTISER_ID,
    campaign_ids: [campaignId],
    operation_status: operationStatus
  };

  const data = await makeRequest('/campaign/update/status/', 'POST', body);

  return { success: true, campaignId };
}

/**
 * Send conversion via TikTok Events API
 */
export async function sendConversion(event, userData = {}, customData = {}) {
  if (!isConfigured()) {
    return {
      success: false,
      platform: PLATFORM,
      error: 'Not configured'
    };
  }

  // Map standard events to TikTok event names
  const eventMap = {
    'Purchase': 'CompletePayment',
    'AddToCart': 'AddToCart',
    'Lead': 'SubmitForm',
    'ViewContent': 'ViewContent',
    'PageVisit': 'PageView',
    'Search': 'Search',
    'SignUp': 'Registration'
  };

  const eventType = eventMap[event] || event;
  const eventId = generateEventId();
  const pixelId = process.env.TIKTOK_PIXEL_ID;

  if (!pixelId) {
    return {
      success: false,
      platform: PLATFORM,
      error: 'TIKTOK_PIXEL_ID not configured'
    };
  }

  try {
    const body = {
      pixel_code: pixelId,
      event: eventType,
      event_id: eventId,
      timestamp: new Date().toISOString(),
      context: {
        user: {},
        page: {
          url: customData.url || 'https://www.agentss.ai'
        }
      },
      properties: {}
    };

    // Add user data (hashed)
    if (userData.email) {
      body.context.user.email = sha256(userData.email);
    }
    if (userData.phone) {
      body.context.user.phone_number = sha256(userData.phone);
    }
    if (userData.externalId) {
      body.context.user.external_id = sha256(userData.externalId);
    }

    // Add properties
    if (customData.value) {
      body.properties.value = customData.value;
      body.properties.currency = customData.currency || 'USD';
    }
    if (customData.contentIds) {
      body.properties.content_ids = customData.contentIds;
    }
    if (customData.contentType) {
      body.properties.content_type = customData.contentType;
    }

    const data = await makeRequest('/pixel/track/', 'POST', body);

    return {
      success: true,
      platform: PLATFORM,
      eventId
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
