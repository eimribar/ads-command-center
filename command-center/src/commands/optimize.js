/**
 * Optimize Command
 *
 * Analyzes cross-platform performance and provides budget optimization recommendations
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { platforms, getAdPlatforms } from '../platforms/index.js';
import { resolveDateRange } from '../utils/api.js';
import { formatCurrency, formatPercent } from '../utils/format.js';

/**
 * Calculate efficiency score for a platform
 * Score = (Conversions * 100) / Spend
 * Higher is better
 */
function calculateEfficiency(data) {
  if (!data.spend || data.spend === 0) return 0;
  if (!data.conversions || data.conversions === 0) return 0;
  return (data.conversions * 100) / data.spend;
}

/**
 * Run optimization analysis
 */
export async function runOptimize(options = {}) {
  const period = options.period || 'last_7d';
  const dateRange = resolveDateRange(period);

  console.log(chalk.cyan('\n🎯 BUDGET OPTIMIZATION ANALYSIS\n'));
  console.log(chalk.gray(`Analyzing performance from ${dateRange.startDate} to ${dateRange.endDate}\n`));

  const spinner = ora('Fetching performance data...').start();

  const adPlatforms = getAdPlatforms();

  if (adPlatforms.length < 2) {
    spinner.fail('Need at least 2 platforms to optimize');
    console.log(chalk.yellow('\nOptimization requires comparing performance across multiple platforms.'));
    return;
  }

  // Fetch insights from all platforms
  const platformData = [];

  const promises = adPlatforms.map(async (platformName) => {
    try {
      const platform = platforms[platformName];
      if (platform && platform.getInsights) {
        return await platform.getInsights(dateRange);
      }
    } catch (error) {
      return null;
    }
  });

  const results = await Promise.all(promises);

  results.forEach(result => {
    if (result && result.spend !== undefined && result.spend > 0) {
      platformData.push({
        ...result,
        efficiency: calculateEfficiency(result)
      });
    }
  });

  spinner.succeed('Analysis complete');

  if (platformData.length < 2) {
    console.log(chalk.yellow('\nNot enough platforms with spend data to optimize.'));
    return;
  }

  // Sort by efficiency (best first)
  platformData.sort((a, b) => b.efficiency - a.efficiency);

  // Calculate average efficiency
  const avgEfficiency = platformData.reduce((sum, p) => sum + p.efficiency, 0) / platformData.length;

  // Display efficiency analysis
  console.log(chalk.bold.cyan('\n📊 Platform Efficiency Analysis\n'));

  const table = new Table({
    head: [
      chalk.bold('Platform'),
      chalk.bold('Spend'),
      chalk.bold('Conv'),
      chalk.bold('CPA'),
      chalk.bold('Efficiency'),
      chalk.bold('Rating')
    ],
    colWidths: [12, 12, 8, 10, 12, 12],
    style: { head: [], border: ['cyan'] }
  });

  platformData.forEach(p => {
    let rating = '⭐⭐⭐';
    let ratingColor = chalk.green;

    if (p.efficiency < avgEfficiency * 0.5) {
      rating = '⭐';
      ratingColor = chalk.red;
    } else if (p.efficiency < avgEfficiency) {
      rating = '⭐⭐';
      ratingColor = chalk.yellow;
    }

    table.push([
      chalk.bold(p.platform),
      formatCurrency(p.spend),
      p.conversions || 0,
      p.cpa ? formatCurrency(p.cpa) : '-',
      p.efficiency.toFixed(2),
      ratingColor(rating)
    ]);
  });

  console.log(table.toString());
  console.log(chalk.gray(`\nAverage efficiency: ${avgEfficiency.toFixed(2)}`));

  // Generate recommendations
  const recommendations = [];
  const best = platformData[0];
  const worst = platformData[platformData.length - 1];

  // Check if there's a significant difference
  if (worst.efficiency < avgEfficiency * 0.5 && best.efficiency > avgEfficiency) {
    const shiftPercent = 20;
    const shiftAmount = Math.round(worst.spend * (shiftPercent / 100));

    if (shiftAmount >= 5) { // Only recommend if shift is meaningful
      const projectedNewConversions = (shiftAmount / best.spend) * best.conversions;

      recommendations.push({
        action: 'SHIFT_BUDGET',
        from: worst.platform,
        to: best.platform,
        amount: shiftAmount,
        projectedGain: Math.round(projectedNewConversions * 10) / 10,
        reason: `${worst.platform} efficiency (${worst.efficiency.toFixed(1)}) is ${formatPercent((1 - worst.efficiency / best.efficiency) * 100, 0)} lower than ${best.platform}`
      });
    }
  }

  // Check for platforms with no conversions but spend
  platformData.forEach(p => {
    if (p.spend > 10 && p.conversions === 0) {
      recommendations.push({
        action: 'PAUSE_OR_OPTIMIZE',
        platform: p.platform,
        amount: p.spend,
        reason: `${p.platform} has ${formatCurrency(p.spend)} spend but 0 conversions`
      });
    }
  });

  // Display recommendations
  if (recommendations.length > 0) {
    console.log(chalk.bold.yellow('\n💡 RECOMMENDATIONS\n'));

    recommendations.forEach((rec, i) => {
      console.log(chalk.bold(`${i + 1}. ${rec.action.replace('_', ' ')}`));

      if (rec.action === 'SHIFT_BUDGET') {
        console.log(chalk.white(`   Shift ${formatCurrency(rec.amount)} from ${rec.from} → ${rec.to}`));
        console.log(chalk.green(`   Projected gain: +${rec.projectedGain} conversions`));
        console.log(chalk.gray(`   Reason: ${rec.reason}`));
      } else if (rec.action === 'PAUSE_OR_OPTIMIZE') {
        console.log(chalk.white(`   Review or pause ${rec.platform}`));
        console.log(chalk.gray(`   Reason: ${rec.reason}`));
      }
      console.log('');
    });

    // Ask if user wants to apply recommendations
    if (!options.dryRun && recommendations.some(r => r.action === 'SHIFT_BUDGET')) {
      const { apply } = await inquirer.prompt([{
        type: 'confirm',
        name: 'apply',
        message: 'Would you like to apply budget shift recommendations?',
        default: false
      }]);

      if (apply) {
        console.log(chalk.yellow('\n⚠️  Budget adjustments require manual implementation.'));
        console.log(chalk.gray('Please adjust budgets in each platform\'s ads manager.\n'));

        // Show specific instructions
        recommendations.filter(r => r.action === 'SHIFT_BUDGET').forEach(rec => {
          console.log(chalk.white(`• ${rec.from}: Reduce daily budget by ${formatCurrency(rec.amount)}`));
          console.log(chalk.white(`• ${rec.to}: Increase daily budget by ${formatCurrency(rec.amount)}`));
        });
      }
    }
  } else {
    console.log(chalk.green('\n✓ All platforms are performing efficiently. No recommendations at this time.\n'));
  }

  return {
    platforms: platformData,
    avgEfficiency,
    recommendations
  };
}

export default runOptimize;
