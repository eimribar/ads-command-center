/**
 * Platform Adapters Index
 *
 * Provides a unified interface to all advertising platforms
 */

import * as meta from './meta.js';
import * as reddit from './reddit.js';
import * as analytics from './analytics.js';
import * as googleAds from './google-ads.js';
import * as tiktok from './tiktok.js';

export const platforms = {
  meta,
  reddit,
  analytics,
  google: googleAds,
  tiktok
};

/**
 * Get list of configured platforms
 */
export function getConfiguredPlatforms() {
  const configured = [];

  if (meta.isConfigured()) configured.push('meta');
  if (reddit.isConfigured()) configured.push('reddit');
  if (analytics.isConfigured()) configured.push('analytics');
  if (googleAds.isConfigured()) configured.push('google');
  if (tiktok.isConfigured()) configured.push('tiktok');

  return configured;
}

/**
 * Get list of ad platforms (excludes analytics)
 */
export function getAdPlatforms() {
  return getConfiguredPlatforms().filter(p => p !== 'analytics');
}

/**
 * Get platform status summary
 */
export function getPlatformStatus() {
  return {
    meta: { configured: meta.isConfigured(), name: 'Meta (Facebook)' },
    reddit: { configured: reddit.isConfigured(), name: 'Reddit' },
    analytics: { configured: analytics.isConfigured(), name: 'Google Analytics' },
    google: { configured: googleAds.isConfigured(), name: 'Google Ads' },
    tiktok: { configured: tiktok.isConfigured(), name: 'TikTok' }
  };
}

export default {
  platforms,
  getConfiguredPlatforms,
  getAdPlatforms,
  getPlatformStatus
};
