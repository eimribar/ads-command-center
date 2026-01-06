/**
 * Report Command
 *
 * Fetches and displays unified performance report across all platforms
 */

import chalk from 'chalk';
import ora from 'ora';
import { platforms, getAdPlatforms } from '../platforms/index.js';
import { resolveDateRange } from '../utils/api.js';
import { createReportTable } from '../utils/format.js';

/**
 * Generate cross-platform performance report
 */
export async function runReport(options = {}) {
  const period = options.period || 'last_7d';
  const dateRange = resolveDateRange(period);

  console.log(chalk.cyan(`\n📊 Fetching performance data for ${period}...`));
  console.log(chalk.gray(`   Date range: ${dateRange.startDate} to ${dateRange.endDate}\n`));

  const spinner = ora('Fetching insights from all platforms...').start();

  const platformResults = [];
  const errors = [];

  // Fetch from all configured ad platforms in parallel
  const adPlatforms = getAdPlatforms();

  if (adPlatforms.length === 0) {
    spinner.fail('No ad platforms configured');
    console.log(chalk.yellow('\nPlease configure at least one platform in .env'));
    return;
  }

  const promises = adPlatforms.map(async (platformName) => {
    try {
      const platform = platforms[platformName];
      if (platform && platform.getInsights) {
        const insights = await platform.getInsights(dateRange);
        return insights;
      }
    } catch (error) {
      errors.push({ platform: platformName, error: error.message });
      return null;
    }
  });

  const results = await Promise.all(promises);

  results.forEach(result => {
    if (result && result.spend !== undefined) {
      platformResults.push(result);
    }
  });

  spinner.succeed('Data fetched from all platforms');

  // Calculate totals
  const totals = {
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0
  };

  platformResults.forEach(p => {
    if (p.spend) totals.spend += p.spend;
    if (p.impressions) totals.impressions += p.impressions;
    if (p.clicks) totals.clicks += p.clicks;
    if (p.conversions) totals.conversions += p.conversions;
  });

  totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  totals.cpa = totals.conversions > 0 ? totals.spend / totals.conversions : null;

  // Calculate ROAS if we have conversion value from analytics
  let totalRevenue = 0;
  if (platforms.analytics.isConfigured()) {
    try {
      const analyticsData = await platforms.analytics.getInsights(dateRange);
      if (analyticsData.conversionValue) {
        totalRevenue = analyticsData.conversionValue;
      }
    } catch (e) {
      // Ignore analytics errors
    }
  }
  totals.roas = totals.spend > 0 && totalRevenue > 0 ? totalRevenue / totals.spend : null;

  // Generate recommendation
  let recommendation = null;
  if (platformResults.length > 1) {
    // Find best and worst performing platforms by CPA
    const withCpa = platformResults.filter(p => p.cpa && p.cpa > 0);
    if (withCpa.length > 1) {
      withCpa.sort((a, b) => a.cpa - b.cpa);
      const best = withCpa[0];
      const worst = withCpa[withCpa.length - 1];

      if (worst.cpa > best.cpa * 1.5) {
        const shiftAmount = Math.round(worst.spend * 0.2);
        recommendation = `Consider shifting $${shiftAmount} from ${worst.platform} → ${best.platform} (CPA: $${worst.cpa.toFixed(2)} vs $${best.cpa.toFixed(2)})`;
      }
    }
  }

  // Display report
  createReportTable({
    platforms: platformResults,
    totals,
    recommendation
  }, `Performance Report (${period})`);

  // Show errors if any
  if (errors.length > 0) {
    console.log(chalk.yellow('⚠️  Some platforms had errors:'));
    errors.forEach(e => {
      console.log(chalk.yellow(`   ${e.platform}: ${e.error}`));
    });
    console.log('');
  }

  return { platforms: platformResults, totals, errors };
}

export default runReport;
