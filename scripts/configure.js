#!/usr/bin/env node
/**
 * Configure script: prompts for the WhatsApp app (base) URL and writes the full
 * GraphQL endpoint into config.json and demo-config.json (public.default.whatsapp["graphql-endpoint"]).
 * Run from the project root: npx storefront-whatsapp-contact-configure
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PROJECT_ROOT = process.cwd();
const CONFIG_FILES = ['config.json', 'demo-config.json'];
const GRAPHQL_PATH = '/api/v1/web/whatsappcontact/graphql';

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve((answer || '').trim());
    });
  });
}

function ensureWhatsappInConfig(obj) {
  if (!obj.public) obj.public = {};
  if (!obj.public.default) obj.public.default = {};
  obj.public.default.whatsapp = obj.public.default.whatsapp || {};
  return obj;
}

function updateConfigFile(filePath, endpoint) {
  if (!fs.existsSync(filePath)) return false;
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn(`Could not read ${path.basename(filePath)}:`, err.message);
    return false;
  }
  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.warn(`Invalid JSON in ${path.basename(filePath)}:`, err.message);
    return false;
  }
  data = ensureWhatsappInConfig(data);
  data.public.default.whatsapp['graphql-endpoint'] = endpoint;
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.warn(`Could not write ${path.basename(filePath)}:`, err.message);
    return false;
  }
}

function buildGraphQLEndpoint(appUrl) {
  const base = (appUrl || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  return base + GRAPHQL_PATH;
}

async function main() {
  console.log('WhatsApp Contact — configure GraphQL endpoint\n');
  const appUrl = await prompt('Enter the WhatsApp app URL (e.g. https://XXXXX-whatsappcontact.adobeioruntime.net): ');
  if (!appUrl) {
    console.log('No URL entered. Exiting.');
    process.exit(0);
    return;
  }
  const endpoint = buildGraphQLEndpoint(appUrl);
  console.log(`Using endpoint: ${endpoint}\n`);
  let updated = 0;
  for (const name of CONFIG_FILES) {
    const filePath = path.join(PROJECT_ROOT, name);
    if (updateConfigFile(filePath, endpoint)) {
      console.log(`Updated ${name}`);
      updated += 1;
    }
  }
  if (updated === 0) {
    console.log('No config files found or updated. Run this from your project root where config.json (or demo-config.json) exists.');
    process.exit(1);
  }
  console.log('\nDone. You can change the endpoint later by re-running this command or editing config.json / demo-config.json.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
