/**
 * Campaigns Command
 *
 * Lists and manages campaigns across all platforms
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { platforms, getAdPlatforms } from '../platforms/index.js';
import { createCampaignsTable, formatCurrency } from '../utils/format.js';

/**
 * List all campaigns across platforms
 */
export async function listCampaigns(options = {}) {
  const spinner = ora('Fetching campaigns from all platforms...').start();

  const allCampaigns = [];
  const errors = [];

  const adPlatforms = getAdPlatforms();

  if (adPlatforms.length === 0) {
    spinner.fail('No ad platforms configured');
    return [];
  }

  const promises = adPlatforms.map(async (platformName) => {
    try {
      const platform = platforms[platformName];
      if (platform && platform.getCampaigns) {
        return await platform.getCampaigns();
      }
      return [];
    } catch (error) {
      errors.push({ platform: platformName, error: error.message });
      return [];
    }
  });

  const results = await Promise.all(promises);

  results.forEach(campaigns => {
    allCampaigns.push(...campaigns);
  });

  spinner.succeed(`Found ${allCampaigns.length} campaigns across ${adPlatforms.length} platforms`);

  // Filter by status if specified
  let filtered = allCampaigns;
  if (options.status) {
    filtered = allCampaigns.filter(c =>
      c.status.toLowerCase() === options.status.toLowerCase()
    );
  }

  // Display campaigns table
  if (filtered.length > 0) {
    // Add spend/results placeholders (would need insights call for real data)
    const campaignsWithData = filtered.map(c => ({
      ...c,
      spend: c.spend || 0,
      results: c.results || 0
    }));

    createCampaignsTable(campaignsWithData);
  } else {
    console.log(chalk.yellow('\nNo campaigns found.\n'));
  }

  // Show errors if any
  if (errors.length > 0) {
    console.log(chalk.yellow('⚠️  Some platforms had errors:'));
    errors.forEach(e => {
      console.log(chalk.yellow(`   ${e.platform}: ${e.error}`));
    });
    console.log('');
  }

  return filtered;
}

/**
 * Update a campaign (pause/resume/budget)
 */
export async function updateCampaign(options = {}) {
  const { platform, campaignId, action, budget } = options;

  if (!platform || !campaignId) {
    console.log(chalk.red('Error: --platform and --id are required'));
    return;
  }

  const platformAdapter = platforms[platform.toLowerCase()];
  if (!platformAdapter) {
    console.log(chalk.red(`Unknown platform: ${platform}`));
    return;
  }

  if (!platformAdapter.isConfigured()) {
    console.log(chalk.red(`${platform} is not configured`));
    return;
  }

  const updates = {};

  if (action === 'pause') {
    updates.status = platform === 'meta' ? 'PAUSED' : 'PAUSED';
  } else if (action === 'resume' || action === 'activate') {
    updates.status = platform === 'meta' ? 'ACTIVE' : 'ACTIVE';
  }

  if (budget) {
    updates.dailyBudget = parseFloat(budget);
  }

  const spinner = ora(`Updating campaign ${campaignId}...`).start();

  try {
    const result = await platformAdapter.updateCampaign(campaignId, updates);

    if (result.success) {
      spinner.succeed(`Campaign ${campaignId} updated successfully`);
    } else {
      spinner.fail(`Failed to update campaign: ${result.message}`);
    }
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
  }
}

/**
 * Interactive campaign management
 */
export async function interactiveCampaigns() {
  console.log(chalk.cyan('\n📢 Campaign Management\n'));

  // First, list all campaigns
  const campaigns = await listCampaigns();

  if (campaigns.length === 0) {
    return;
  }

  // Ask what action to take
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: 'Pause a campaign', value: 'pause' },
      { name: 'Resume a campaign', value: 'resume' },
      { name: 'Update budget', value: 'budget' },
      { name: 'Exit', value: 'exit' }
    ]
  }]);

  if (action === 'exit') {
    return;
  }

  // Select campaign
  const { selectedCampaign } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedCampaign',
    message: 'Select a campaign:',
    choices: campaigns.map(c => ({
      name: `[${c.platform}] ${c.name} (${c.status})`,
      value: c
    }))
  }]);

  if (action === 'budget') {
    const { newBudget } = await inquirer.prompt([{
      type: 'input',
      name: 'newBudget',
      message: `Enter new daily budget (current: ${formatCurrency(selectedCampaign.budget)}):`,
      validate: (input) => {
        const num = parseFloat(input);
        return !isNaN(num) && num > 0 ? true : 'Please enter a valid amount';
      }
    }]);

    await updateCampaign({
      platform: selectedCampaign.platform,
      campaignId: selectedCampaign.id,
      budget: newBudget
    });
  } else {
    await updateCampaign({
      platform: selectedCampaign.platform,
      campaignId: selectedCampaign.id,
      action
    });
  }
}

export default {
  listCampaigns,
  updateCampaign,
  interactiveCampaigns
};
