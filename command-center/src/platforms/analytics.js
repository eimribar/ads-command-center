import { createApiClient, handleApiError } from '../utils/api.js';

const PLATFORM = 'Analytics';

/**
 * Get Google Analytics configuration from environment
 */
function getConfig() {
  const accessToken = process.env.GA_ACCESS_TOKEN;
  const propertyId = process.env.GA_PROPERTY_ID;

  if (!accessToken) {
    throw new Error('GA_ACCESS_TOKEN not configured');
  }
  if (!propertyId) {
    throw new Error('GA_PROPERTY_ID not configured');
  }

  return { accessToken, propertyId };
}

/**
 * Create GA4 Data API client
 */
function createClient() {
  const config = getConfig();
  return createApiClient('https://analyticsdata.googleapis.com/v1beta', {
    'Authorization': `Bearer ${config.accessToken}`
  });
}

/**
 * Check if Analytics is configured
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
 * Get events data from Google Analytics
 */
export async function getEvents(dateRange) {
  const config = getConfig();
  const client = createClient();

  try {
    const response = await client.post(
      `/properties/${config.propertyId}:runReport`,
      {
        dateRanges: [{
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }],
        dimensions: [{ name: 'eventName' }],
        metrics: [
          { name: 'eventCount' },
          { name: 'eventValue' }
        ]
      }
    );

    const events = {};
    (response.data.rows || []).forEach(row => {
      const eventName = row.dimensionValues[0].value;
      events[eventName] = {
        count: parseInt(row.metricValues[0].value || 0),
        value: parseFloat(row.metricValues[1].value || 0)
      };
    });

    return events;
  } catch (error) {
    handleApiError(error, PLATFORM);
  }
}

/**
 * Get traffic overview
 */
export async function getTrafficOverview(dateRange) {
  const config = getConfig();
  const client = createClient();

  try {
    const response = await client.post(
      `/properties/${config.propertyId}:runReport`,
      {
        dateRanges: [{
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'screenPageViews' }
        ]
      }
    );

    const row = response.data.rows?.[0];
    if (!row) {
      return {
        totalUsers: 0,
        newUsers: 0,
        sessions: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        pageViews: 0
      };
    }

    return {
      totalUsers: parseInt(row.metricValues[0].value || 0),
      newUsers: parseInt(row.metricValues[1].value || 0),
      sessions: parseInt(row.metricValues[2].value || 0),
      bounceRate: parseFloat(row.metricValues[3].value || 0),
      avgSessionDuration: parseFloat(row.metricValues[4].value || 0),
      pageViews: parseInt(row.metricValues[5].value || 0)
    };
  } catch (error) {
    handleApiError(error, PLATFORM);
  }
}

/**
 * Get traffic by source
 */
export async function getTrafficBySource(dateRange) {
  const config = getConfig();
  const client = createClient();

  try {
    const response = await client.post(
      `/properties/${config.propertyId}:runReport`,
      {
        dateRanges: [{
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'sessionMedium' }
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'conversions' }
        ],
        orderBys: [{
          metric: { metricName: 'sessions' },
          desc: true
        }],
        limit: 10
      }
    );

    return (response.data.rows || []).map(row => ({
      source: row.dimensionValues[0].value,
      medium: row.dimensionValues[1].value,
      sessions: parseInt(row.metricValues[0].value || 0),
      users: parseInt(row.metricValues[1].value || 0),
      conversions: parseInt(row.metricValues[2].value || 0)
    }));
  } catch (error) {
    handleApiError(error, PLATFORM);
  }
}

/**
 * Get conversion data
 */
export async function getConversions(dateRange) {
  const config = getConfig();
  const client = createClient();

  try {
    const response = await client.post(
      `/properties/${config.propertyId}:runReport`,
      {
        dateRanges: [{
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }],
        dimensions: [{ name: 'eventName' }],
        metrics: [
          { name: 'conversions' },
          { name: 'eventValue' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: ['purchase', 'add_to_cart', 'generate_lead', 'sign_up', 'begin_checkout']
            }
          }
        }
      }
    );

    const conversions = {};
    (response.data.rows || []).forEach(row => {
      conversions[row.dimensionValues[0].value] = {
        count: parseInt(row.metricValues[0].value || 0),
        value: parseFloat(row.metricValues[1].value || 0)
      };
    });

    return conversions;
  } catch (error) {
    handleApiError(error, PLATFORM);
  }
}

/**
 * Get combined insights for the report command
 * (Analytics doesn't have spend, so we return traffic metrics)
 */
export async function getInsights(dateRange) {
  try {
    const traffic = await getTrafficOverview(dateRange);
    const conversions = await getConversions(dateRange);

    // Sum up all conversions
    let totalConversions = 0;
    let totalValue = 0;
    Object.values(conversions).forEach(c => {
      totalConversions += c.count;
      totalValue += c.value;
    });

    return {
      platform: 'Analytics',
      spend: null, // Analytics doesn't track spend
      impressions: traffic.pageViews,
      clicks: traffic.sessions, // Using sessions as a proxy
      ctr: null,
      conversions: totalConversions,
      cpa: null,
      roas: null,
      // Extra analytics-specific data
      users: traffic.totalUsers,
      newUsers: traffic.newUsers,
      bounceRate: traffic.bounceRate,
      conversionValue: totalValue
    };
  } catch (error) {
    console.warn(`Analytics insights unavailable: ${error.message}`);
    return {
      platform: 'Analytics',
      spend: null,
      impressions: 0,
      clicks: 0,
      ctr: null,
      conversions: 0,
      cpa: null,
      roas: null
    };
  }
}

export default {
  isConfigured,
  getEvents,
  getTrafficOverview,
  getTrafficBySource,
  getConversions,
  getInsights
};
