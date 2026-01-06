#!/usr/bin/env node

/**
 * AGENTSS ADS COMMAND CENTER
 *
 * Unified CLI for managing ads across Meta, Reddit, Google Ads, TikTok, and Analytics
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from master .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import commands
import runReport from './commands/report.js';
import { listCampaigns, updateCampaign, interactiveCampaigns } from './commands/campaigns.js';
import { sendConversion, SUPPORTED_EVENTS } from './commands/conversions.js';
import runOptimize from './commands/optimize.js';

// Import platform status
import { getPlatformStatus, getConfiguredPlatforms } from './platforms/index.js';

const program = new Command();

// ASCII Art Banner
function showBanner() {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║      █████╗  ██████╗ ███████╗███╗   ██╗████████╗███████╗███████╗  ║
║     ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔════╝  ║
║     ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ███████╗███████╗  ║
║     ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║╚════██║  ║
║     ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ███████║███████║  ║
║     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝  ║
║                                                                   ║
║                    ADS COMMAND CENTER v1.0                        ║
║        Unified Multi-Platform Advertising Management              ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`));
}

// Show platform status
function showStatus() {
  const status = getPlatformStatus();

  console.log(chalk.bold('\n📊 Platform Status:\n'));

  Object.entries(status).forEach(([key, value]) => {
    const icon = value.configured ? chalk.green('✓') : chalk.red('✗');
    const statusText = value.configured ? chalk.green('Connected') : chalk.gray('Not configured');
    console.log(`  ${icon} ${value.name.padEnd(20)} ${statusText}`);
  });

  console.log('');
}

// Interactive mode
async function interactiveMode() {
  showBanner();
  showStatus();

  const { command } = await inquirer.prompt([{
    type: 'list',
    name: 'command',
    message: 'What would you like to do?',
    choices: [
      { name: '📊 View Performance Report', value: 'report' },
      { name: '📢 Manage Campaigns', value: 'campaigns' },
      { name: '🎯 Send Conversion Event', value: 'convert' },
      { name: '💡 Get Optimization Recommendations', value: 'optimize' },
      { name: '📋 Show Platform Status', value: 'status' },
      new inquirer.Separator(),
      { name: '🚪 Exit', value: 'exit' }
    ]
  }]);

  switch (command) {
    case 'report':
      const { period } = await inquirer.prompt([{
        type: 'list',
        name: 'period',
        message: 'Select time period:',
        choices: [
          { name: 'Today', value: 'today' },
          { name: 'Yesterday', value: 'yesterday' },
          { name: 'Last 7 days', value: 'last_7d' },
          { name: 'Last 30 days', value: 'last_30d' },
          { name: 'This month', value: 'this_month' }
        ]
      }]);
      await runReport({ period });
      break;

    case 'campaigns':
      await interactiveCampaigns();
      break;

    case 'convert':
      const { event, email, value } = await inquirer.prompt([
        {
          type: 'list',
          name: 'event',
          message: 'Select event type:',
          choices: SUPPORTED_EVENTS
        },
        {
          type: 'input',
          name: 'email',
          message: 'Customer email (optional):',
        },
        {
          type: 'input',
          name: 'value',
          message: 'Event value in USD (optional):',
          when: (answers) => ['Purchase', 'AddToCart'].includes(answers.event)
        }
      ]);
      await sendConversion(event, { email, value });
      break;

    case 'optimize':
      await runOptimize();
      break;

    case 'status':
      showStatus();
      break;

    case 'exit':
      console.log(chalk.cyan('\n👋 Goodbye!\n'));
      process.exit(0);
  }

  // Loop back to menu
  const { again } = await inquirer.prompt([{
    type: 'confirm',
    name: 'again',
    message: 'Do something else?',
    default: true
  }]);

  if (again) {
    await interactiveMode();
  } else {
    console.log(chalk.cyan('\n👋 Goodbye!\n'));
  }
}

// Setup CLI commands
program
  .name('ads')
  .description('Agentss Ads Command Center - Unified Multi-Platform Advertising Management')
  .version('1.0.0');

// Report command
program
  .command('report')
  .description('Generate cross-platform performance report')
  .option('-p, --period <period>', 'Time period (today, yesterday, last_7d, last_30d)', 'last_7d')
  .action(async (options) => {
    await runReport(options);
  });

// Campaigns command
program
  .command('campaigns')
  .description('List and manage campaigns')
  .option('-s, --status <status>', 'Filter by status (active, paused)')
  .option('--platform <platform>', 'Filter by platform')
  .option('--pause <id>', 'Pause a campaign')
  .option('--resume <id>', 'Resume a campaign')
  .action(async (options) => {
    if (options.pause) {
      await updateCampaign({ campaignId: options.pause, action: 'pause', platform: options.platform });
    } else if (options.resume) {
      await updateCampaign({ campaignId: options.resume, action: 'resume', platform: options.platform });
    } else {
      await listCampaigns(options);
    }
  });

// Convert command
program
  .command('convert <event>')
  .description('Send conversion event to all platforms')
  .option('-e, --email <email>', 'Customer email')
  .option('-v, --value <value>', 'Event value in USD')
  .option('-o, --order <orderId>', 'Order ID')
  .option('-c, --currency <currency>', 'Currency code', 'USD')
  .action(async (event, options) => {
    await sendConversion(event, options);
  });

// Optimize command
program
  .command('optimize')
  .description('Get budget optimization recommendations')
  .option('-p, --period <period>', 'Analysis period', 'last_7d')
  .option('--dry-run', 'Show recommendations without prompting to apply')
  .action(async (options) => {
    await runOptimize(options);
  });

// Status command
program
  .command('status')
  .description('Show platform connection status')
  .action(() => {
    showBanner();
    showStatus();
  });

// Default to interactive mode if no command specified
program
  .action(async () => {
    await interactiveMode();
  });

// Parse arguments
program.parse(process.argv);
