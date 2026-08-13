/**
 * PORTFOLIO DATA MIGRATION SCRIPT
 * ================================
 * One-time script to seed the Upstash Redis database with existing portfolio data.
 *
 * Usage:
 *   1. Set environment variables (or create a .env file):
 *      UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
 *      UPSTASH_REDIS_REST_TOKEN=AYxxxxxxxxxx
 *
 *   2. Run the migration:
 *      node migrate.js
 *
 *   3. Verify:
 *      The script will confirm successful migration.
 *
 * This script reads from:
 *   - .data/portfolio_data.json (portfolio content)
 *   - .data/messages.json (contact messages)
 *
 * And writes to:
 *   - Upstash Redis key: portfolio_cms_data
 *   - Upstash Redis key: portfolio_contact_messages
 */

const fs = require('fs');
const path = require('path');

// Load .env file if it exists
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    console.log('✓ Loaded .env file');
  }
} catch (e) {
  // .env file is optional
}

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!KV_URL || !KV_TOKEN) {
  console.error('❌ ERROR: Missing Upstash Redis environment variables.');
  console.error('');
  console.error('Please set:');
  console.error('  UPSTASH_REDIS_REST_URL=https://your-db.upstash.io');
  console.error('  UPSTASH_REDIS_REST_TOKEN=AYxxxxxxxxxx');
  console.error('');
  console.error('You can set them inline:');
  console.error('  UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node migrate.js');
  console.error('');
  console.error('Or create a .env file in the project root.');
  process.exit(1);
}

async function saveToKV(key, data) {
  const payloadString = typeof data === 'string' ? data : JSON.stringify(data);
  const res = await fetch(`${KV_URL.replace(/\/$/, '')}/set/${key}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payloadString)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save "${key}": HTTP ${res.status} — ${text}`);
  }

  return true;
}

async function loadFromKV(key) {
  const res = await fetch(`${KV_URL.replace(/\/$/, '')}/get/${key}`, {
    headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
  });

  if (res.ok) {
    const text = await res.text();
    if (text && text.trim()) {
      const json = JSON.parse(text);
      if (json && json.result !== undefined && json.result !== null) {
        return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
      }
    }
  }
  return null;
}

async function migrate() {
  console.log('');
  console.log('🔄 Portfolio CMS — Data Migration to Upstash Redis');
  console.log('='.repeat(55));
  console.log('');
  console.log(`📡 Target: ${KV_URL}`);
  console.log('');

  // --- Migrate Portfolio Data ---
  const portfolioPath = path.join(__dirname, '.data', 'portfolio_data.json');
  if (fs.existsSync(portfolioPath)) {
    try {
      const raw = fs.readFileSync(portfolioPath, 'utf8');
      const data = JSON.parse(raw);
      const sectionCount = Object.keys(data).length;

      console.log(`📦 Found portfolio data: ${sectionCount} sections`);
      console.log(`   Sections: ${Object.keys(data).join(', ')}`);

      await saveToKV('portfolio_cms_data', data);
      console.log('✅ Portfolio data migrated successfully!');
    } catch (e) {
      console.error(`❌ Error migrating portfolio data: ${e.message}`);
    }
  } else {
    console.log('⚠️  No .data/portfolio_data.json found — skipping portfolio data migration.');
    console.log('   (Default data will be used instead.)');
  }

  console.log('');

  // --- Migrate Messages ---
  const messagesPath = path.join(__dirname, '.data', 'messages.json');
  if (fs.existsSync(messagesPath)) {
    try {
      const raw = fs.readFileSync(messagesPath, 'utf8');
      const messages = JSON.parse(raw);

      if (Array.isArray(messages)) {
        console.log(`📨 Found ${messages.length} contact message(s)`);
        await saveToKV('portfolio_contact_messages', messages);
        console.log('✅ Messages migrated successfully!');
      } else {
        console.log('⚠️  messages.json is not an array — skipping.');
      }
    } catch (e) {
      console.error(`❌ Error migrating messages: ${e.message}`);
    }
  } else {
    console.log('ℹ️  No .data/messages.json found — skipping messages migration.');
  }

  console.log('');

  // --- Verify ---
  console.log('🔍 Verifying migration...');
  const verifyData = await loadFromKV('portfolio_cms_data');
  if (verifyData && typeof verifyData === 'object') {
    console.log(`✅ Verification passed: ${Object.keys(verifyData).length} sections in database`);
  } else {
    console.error('❌ Verification failed: could not read portfolio data from database');
  }

  const verifyMsgs = await loadFromKV('portfolio_contact_messages');
  if (Array.isArray(verifyMsgs)) {
    console.log(`✅ Verification passed: ${verifyMsgs.length} messages in database`);
  } else {
    console.log('ℹ️  No messages found in database (this is fine if none existed).');
  }

  console.log('');
  console.log('='.repeat(55));
  console.log('🎉 Migration complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Add these environment variables to Vercel:');
  console.log('     UPSTASH_REDIS_REST_URL');
  console.log('     UPSTASH_REDIS_REST_TOKEN');
  console.log('     ADMIN_API_SECRET');
  console.log('');
  console.log('  2. Redeploy your project:');
  console.log('     git add -A && git commit -m "fix: persistent database" && git push');
  console.log('');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
