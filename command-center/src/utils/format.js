import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Format currency
 */
export function formatCurrency(value, currency = 'USD') {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(value);
}

/**
 * Format number with commas
 */
export function formatNumber(value) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format ROAS
 */
export function formatRoas(value) {
  if (value === null || value === undefined || value === 0) return '-';
  return `${value.toFixed(2)}x`;
}

/**
 * Get platform color
 */
export function getPlatformColor(platform) {
  const colors = {
    meta: chalk.blue,
    reddit: chalk.red,
    google: chalk.green,
    tiktok: chalk.magenta,
    analytics: chalk.cyan,
    total: chalk.white.bold
  };
  return colors[platform.toLowerCase()] || chalk.white;
}

/**
 * Get status color
 */
export function getStatusColor(status) {
  const statusLower = status?.toLowerCase();
  if (['active', 'enabled', 'running'].includes(statusLower)) {
    return chalk.green;
  }
  if (['paused', 'disabled', 'stopped'].includes(statusLower)) {
    return chalk.yellow;
  }
  if (['error', 'failed', 'rejected'].includes(statusLower)) {
    return chalk.red;
  }
  return chalk.gray;
}

/**
 * Create unified performance report table
 */
export function createReportTable(data, title) {
  console.log('\n' + chalk.bold.cyan('═'.repeat(75)));
  console.log(chalk.bold.cyan('  AGENTSS ADS COMMAND CENTER'));
  console.log(chalk.bold.cyan(`  ${title}`));
  console.log(chalk.bold.cyan('═'.repeat(75)));

  const table = new Table({
    head: [
      chalk.bold('Platform'),
      chalk.bold('Spend'),
      chalk.bold('Impr'),
      chalk.bold('Clicks'),
      chalk.bold('CTR'),
      chalk.bold('Conv'),
      chalk.bold('CPA'),
      chalk.bold('ROAS')
    ],
    colWidths: [12, 12, 10, 10, 8, 8, 10, 8],
    style: {
      head: [],
      border: ['cyan']
    }
  });

  // Add platform rows
  data.platforms.forEach(p => {
    const color = getPlatformColor(p.platform);
    table.push([
      color(p.platform),
      formatCurrency(p.spend),
      formatNumber(p.impressions),
      formatNumber(p.clicks),
      formatPercent(p.ctr),
      formatNumber(p.conversions),
      formatCurrency(p.cpa),
      formatRoas(p.roas)
    ]);
  });

  // Add separator
  table.push([
    chalk.gray('─'.repeat(10)),
    chalk.gray('─'.repeat(10)),
    chalk.gray('─'.repeat(8)),
    chalk.gray('─'.repeat(8)),
    chalk.gray('─'.repeat(6)),
    chalk.gray('─'.repeat(6)),
    chalk.gray('─'.repeat(8)),
    chalk.gray('─'.repeat(6))
  ]);

  // Add totals row
  const t = data.totals;
  table.push([
    chalk.bold.white('TOTAL'),
    chalk.bold(formatCurrency(t.spend)),
    chalk.bold(formatNumber(t.impressions)),
    chalk.bold(formatNumber(t.clicks)),
    chalk.bold(formatPercent(t.ctr)),
    chalk.bold(formatNumber(t.conversions)),
    chalk.bold(formatCurrency(t.cpa)),
    chalk.bold(formatRoas(t.roas))
  ]);

  console.log(table.toString());

  // Add recommendations if any
  if (data.recommendation) {
    console.log('\n' + chalk.yellow('📈 Recommendation: ') + data.recommendation);
  }

  console.log('');
}

/**
 * Create campaigns table
 */
export function createCampaignsTable(campaigns) {
  const table = new Table({
    head: [
      chalk.bold('Platform'),
      chalk.bold('Campaign'),
      chalk.bold('Status'),
      chalk.bold('Budget'),
      chalk.bold('Spend'),
      chalk.bold('Results')
    ],
    colWidths: [10, 30, 10, 12, 12, 12],
    style: {
      head: [],
      border: ['cyan']
    },
    wordWrap: true
  });

  campaigns.forEach(c => {
    const platformColor = getPlatformColor(c.platform);
    const statusColor = getStatusColor(c.status);

    table.push([
      platformColor(c.platform),
      c.name.substring(0, 28),
      statusColor(c.status),
      formatCurrency(c.budget),
      formatCurrency(c.spend),
      formatNumber(c.results)
    ]);
  });

  console.log('\n' + chalk.bold.cyan('📢 Active Campaigns Across All Platforms\n'));
  console.log(table.toString());
  console.log('');
}

/**
 * Create conversion confirmation
 */
export function showConversionResult(results) {
  console.log('\n' + chalk.bold.green('✓ Conversion Event Sent Successfully\n'));

  const table = new Table({
    head: [chalk.bold('Platform'), chalk.bold('Status'), chalk.bold('Details')],
    colWidths: [12, 12, 40],
    style: { head: [], border: ['green'] }
  });

  results.forEach(r => {
    const color = r.success ? chalk.green : chalk.red;
    table.push([
      getPlatformColor(r.platform)(r.platform),
      color(r.success ? '✓ Sent' : '✗ Failed'),
      r.message || '-'
    ]);
  });

  console.log(table.toString());
  console.log('');
}

/**
 * Show loading spinner helper
 */
export function createSpinner(text) {
  return {
    text,
    start: () => console.log(chalk.cyan(`⏳ ${text}...`)),
    succeed: (msg) => console.log(chalk.green(`✓ ${msg || text}`)),
    fail: (msg) => console.log(chalk.red(`✗ ${msg || text}`))
  };
}

export default {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRoas,
  getPlatformColor,
  getStatusColor,
  createReportTable,
  createCampaignsTable,
  showConversionResult,
  createSpinner
};
