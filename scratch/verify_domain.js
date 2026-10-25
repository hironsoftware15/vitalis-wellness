#!/usr/bin/env node
/**
 * verify_domain.js
 * Verifies DNS propagation, Firebase Hosting status, and SSL readiness for nexvital.com
 */

const https = require('https');
const fs = require('fs');

const DOMAIN = 'nexvital.com';
const EXPECTED_IP = '199.36.158.100';

function queryGoogleDns(name, type) {
  return new Promise((resolve) => {
    https.get(`https://dns.google/resolve?name=${name}&type=${type}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: e.message });
        }
      });
    }).on('error', err => resolve({ error: err.message }));
  });
}

function getFirebaseDomainStatus(domain) {
  return new Promise((resolve) => {
    const configPath = process.env.HOME + '/.config/configstore/firebase-tools.json';
    if (!fs.existsSync(configPath)) return resolve(null);
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const token = cfg.tokens && cfg.tokens.access_token;
      if (!token) return resolve(null);

      https.get({
        hostname: 'firebasehosting.googleapis.com',
        path: `/v1beta1/projects/rugged-alcove-388517/sites/medicore-wellness/domains/${domain}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'FirebaseCLI/13.0.0'
        }
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`  NexVital Custom Domain Verification (${DOMAIN})`);
  console.log(`======================================================\n`);

  console.log(`1. Checking DNS A records via Google Anycast DNS...`);
  const dnsRes = await queryGoogleDns(DOMAIN, 'A');
  const answers = dnsRes.Answer || [];
  const currentIps = answers.filter(a => a.type === 1).map(a => a.data);

  console.log(`   Current A records:`, currentIps.length ? currentIps.join(', ') : 'None found');
  const isMatch = currentIps.includes(EXPECTED_IP);
  if (isMatch) {
    console.log(`   [SUCCESS] ${DOMAIN} is pointing to Firebase Hosting (${EXPECTED_IP})!\n`);
  } else {
    console.log(`   [PENDING] ${DOMAIN} is pointing to: ${currentIps.join(', ')}.`);
    console.log(`   Expected IP: ${EXPECTED_IP}\n`);
  }

  console.log(`2. Checking Firebase Hosting custom domain status...`);
  const fbRes = await getFirebaseDomainStatus(DOMAIN);
  if (fbRes) {
    console.log(`   Domain Status:     ${fbRes.status || 'UNKNOWN'}`);
    console.log(`   DNS Status:        ${fbRes.provisioning?.dnsStatus || 'UNKNOWN'}`);
    console.log(`   SSL Certificate:   ${fbRes.provisioning?.certStatus || 'UNKNOWN'}`);
    if (fbRes.provisioning?.certChallengeDns) {
      console.log(`   DNS ACME Challenge: ${fbRes.provisioning.certChallengeDns.domainName}`);
      console.log(`   TXT Record Value:   ${fbRes.provisioning.certChallengeDns.token}`);
    }
  } else {
    console.log(`   [INFO] Could not fetch Firebase API status (run 'firebase login' if needed).`);
  }

  console.log(`\n======================================================\n`);
}

main();
