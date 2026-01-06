/**
 * Conversions Command
 *
 * Sends conversion events to all configured platforms simultaneously
 */

import chalk from 'chalk';
import ora from 'ora';
import { platforms, getAdPlatforms } from '../platforms/index.js';
import { generateEventId } from '../utils/api.js';
import { showConversionResult } from '../utils/format.js';

/**
 * Supported conversion events
 */
export const SUPPORTED_EVENTS = [
  'Purchase',
  'AddToCart',
  'Lead',
  'ViewContent',
  'PageVisit',
  'Search',
  'SignUp'
];

/**
 * Send conversion to all platforms
 */
export async function sendConversion(event, options = {}) {
  const {
    email,
    phone,
    value,
    currency = 'USD',
    orderId,
    url,
    firstName,
    lastName,
    ip,
    userAgent,
    clickId
  } = options;

  // Validate event
  if (!SUPPORTED_EVENTS.includes(event)) {
    console.log(chalk.red(`Unknown event: ${event}`));
    console.log(chalk.yellow(`Supported events: ${SUPPORTED_EVENTS.join(', ')}`));
    return;
  }

  console.log(chalk.cyan(`\n🎯 Sending ${event} conversion to all platforms...\n`));

  // Generate a shared event ID for deduplication
  const sharedEventId = generateEventId();

  const userData = {
    email,
    phone,
    firstName,
    lastName,
    ip,
    userAgent,
    clickId
  };

  const customData = {
    value: value ? parseFloat(value) : undefined,
    currency,
    orderId,
    url: url || 'https://www.agentss.ai'
  };

  const results = [];
  const adPlatforms = getAdPlatforms();

  // Log what we're sending
  console.log(chalk.gray('Event details:'));
  console.log(chalk.gray(`  Event: ${event}`));
  console.log(chalk.gray(`  Event ID: ${sharedEventId}`));
  if (email) console.log(chalk.gray(`  Email: ${email.substring(0, 3)}...`));
  if (value) console.log(chalk.gray(`  Value: ${currency} ${value}`));
  if (orderId) console.log(chalk.gray(`  Order ID: ${orderId}`));
  console.log('');

  const spinner = ora('Sending to platforms...').start();

  // Send to each platform
  const promises = adPlatforms.map(async (platformName) => {
    try {
      const platform = platforms[platformName];
      if (platform && platform.sendConversion) {
        const result = await platform.sendConversion(event, userData, customData);
        return {
          platform: platformName.charAt(0).toUpperCase() + platformName.slice(1),
          success: result.success,
          message: result.message || result.eventId || ''
        };
      }
      return {
        platform: platformName,
        success: false,
        message: 'No sendConversion method'
      };
    } catch (error) {
      return {
        platform: platformName.charAt(0).toUpperCase() + platformName.slice(1),
        success: false,
        message: error.message
      };
    }
  });

  const allResults = await Promise.all(promises);

  spinner.stop();

  // Show results
  const successCount = allResults.filter(r => r.success).length;
  if (successCount === allResults.length) {
    console.log(chalk.green(`✓ Conversion sent to all ${successCount} platforms`));
  } else if (successCount > 0) {
    console.log(chalk.yellow(`⚠ Conversion sent to ${successCount}/${allResults.length} platforms`));
  } else {
    console.log(chalk.red(`✗ Failed to send conversion to any platform`));
  }

  showConversionResult(allResults);

  return allResults;
}

/**
 * Quick conversion helpers
 */
export async function sendPurchase(email, value, orderId) {
  return sendConversion('Purchase', { email, value, orderId });
}

export async function sendLead(email) {
  return sendConversion('Lead', { email });
}

export async function sendAddToCart(email, value) {
  return sendConversion('AddToCart', { email, value });
}

export default {
  SUPPORTED_EVENTS,
  sendConversion,
  sendPurchase,
  sendLead,
  sendAddToCart
};
