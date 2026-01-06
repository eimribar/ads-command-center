import axios from 'axios';
import crypto from 'crypto';

/**
 * Create an axios instance with common settings
 */
export function createApiClient(baseURL, headers = {}) {
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

/**
 * SHA256 hash a value (for email/phone hashing in CAPI)
 */
export function sha256(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

/**
 * Generate a unique event ID for conversion deduplication
 */
export function generateEventId() {
  return `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Convert date preset to actual dates
 */
export function resolveDateRange(preset) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const getDateDaysAgo = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: today };
    case 'yesterday':
      return { startDate: getDateDaysAgo(1), endDate: getDateDaysAgo(1) };
    case 'last_7d':
      return { startDate: getDateDaysAgo(7), endDate: getDateDaysAgo(1) };
    case 'last_30d':
      return { startDate: getDateDaysAgo(30), endDate: getDateDaysAgo(1) };
    case 'this_month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return { startDate: startOfMonth, endDate: today };
    case 'last_month':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: lastMonthStart.toISOString().split('T')[0],
        endDate: lastMonthEnd.toISOString().split('T')[0]
      };
    default:
      // Assume it's a custom date range like "2025-12-01:2025-12-31"
      if (preset.includes(':')) {
        const [start, end] = preset.split(':');
        return { startDate: start, endDate: end };
      }
      return { startDate: getDateDaysAgo(7), endDate: today };
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error, platform) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      throw new Error(`${platform}: Token expired or invalid. Please refresh your access token.`);
    }
    if (status === 403) {
      throw new Error(`${platform}: Permission denied. Check your API permissions.`);
    }
    if (status === 429) {
      throw new Error(`${platform}: Rate limit exceeded. Please wait and try again.`);
    }

    throw new Error(`${platform} API Error (${status}): ${JSON.stringify(data)}`);
  }

  if (error.code === 'ECONNREFUSED') {
    throw new Error(`${platform}: Connection refused. Check your internet connection.`);
  }

  throw new Error(`${platform}: ${error.message}`);
}

export default {
  createApiClient,
  sha256,
  generateEventId,
  resolveDateRange,
  handleApiError
};
