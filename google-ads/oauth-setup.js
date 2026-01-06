#!/usr/bin/env node

/**
 * Google Ads OAuth Setup Script
 *
 * This script helps you complete the OAuth flow to get a refresh token
 * for the Google Ads API.
 *
 * Prerequisites:
 * 1. Enable "Google Ads API" in Google Cloud Console:
 *    https://console.cloud.google.com/apis/library/googleads.googleapis.com
 *
 * 2. Ensure your OAuth client has the correct redirect URI configured
 */

import readline from 'readline';
import https from 'https';

// Load from environment (required)
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost';
const SCOPE = 'https://www.googleapis.com/auth/adwords';

// Generate authorization URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log('\n' + '='.repeat(70));
console.log('GOOGLE ADS API - OAUTH AUTHORIZATION');
console.log('='.repeat(70));

console.log('\n📋 STEP 1: Enable the Google Ads API');
console.log('   Open this URL in your browser:');
console.log('\n   https://console.cloud.google.com/apis/library/googleads.googleapis.com\n');
console.log('   Click "ENABLE" if not already enabled.\n');

console.log('📋 STEP 2: Authorize access');
console.log('   Open this URL in your browser:\n');
console.log(`   ${authUrl}\n`);

console.log('📋 STEP 3: After authorizing, you\'ll be redirected to a URL like:');
console.log('   http://localhost/?code=4/0XXXXX...');
console.log('\n   Copy the ENTIRE URL and paste it below.\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Paste the redirect URL here: ', (redirectUrl) => {
  rl.close();

  // Extract the authorization code from the URL
  let code;
  try {
    const url = new URL(redirectUrl);
    code = url.searchParams.get('code');
  } catch (e) {
    // Maybe they just pasted the code directly
    code = redirectUrl.trim();
  }

  if (!code) {
    console.error('\n❌ Could not extract authorization code from URL');
    process.exit(1);
  }

  console.log('\n🔄 Exchanging authorization code for tokens...\n');

  // Exchange code for tokens
  const postData = new URLSearchParams({
    code: code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code'
  }).toString();

  const options = {
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const tokens = JSON.parse(data);

        if (tokens.error) {
          console.error('❌ Error:', tokens.error_description || tokens.error);
          process.exit(1);
        }

        console.log('✅ SUCCESS! Here are your tokens:\n');
        console.log('='.repeat(70));
        console.log('REFRESH TOKEN (save this - it doesn\'t expire):');
        console.log('='.repeat(70));
        console.log(`\n${tokens.refresh_token}\n`);

        console.log('='.repeat(70));
        console.log('ACCESS TOKEN (expires in 1 hour):');
        console.log('='.repeat(70));
        console.log(`\n${tokens.access_token}\n`);

        console.log('='.repeat(70));
        console.log('📝 Add this to your .env file:');
        console.log('='.repeat(70));
        console.log(`\nGOOGLE_ADS_REFRESH_TOKEN="${tokens.refresh_token}"\n`);

      } catch (e) {
        console.error('❌ Failed to parse response:', data);
        process.exit(1);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
    process.exit(1);
  });

  req.write(postData);
  req.end();
});
