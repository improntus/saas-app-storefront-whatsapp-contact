#!/usr/bin/env node
/**
 * Install script: copies WhatsApp block, scripts and icons from this package
 * into the host project (AEM EDS + Commerce). Run automatically on npm postinstall.
 */

const fs = require('fs');
const path = require('path');

const PKG_ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(PKG_ROOT, 'assets');
const PROJECT_ROOT = process.cwd();

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function addWhatsAppToInitializers() {
  const indexPath = path.join(PROJECT_ROOT, 'scripts', 'initializers', 'index.js');
  if (!fs.existsSync(indexPath)) return;
  let content = fs.readFileSync(indexPath, 'utf8');
  if (content.includes('whatsapp.js')) return;
  // Insert after "setAuthHeaders(!!token);" so WhatsApp loads on init
  const needle = 'setAuthHeaders(!!token);';
  const insert = "\n    // Initialize WhatsApp\n    import('./whatsapp.js');";
  if (content.includes(needle)) {
    content = content.replace(needle, needle + insert);
    fs.writeFileSync(indexPath, content);
    console.log('storefront-whatsapp-contact: added WhatsApp import to scripts/initializers/index.js');
  }
}

function main() {
  if (!fs.existsSync(ASSETS)) {
    console.warn('storefront-whatsapp-contact: assets folder not found, skipping install.');
    return;
  }

  const blocksSrc = path.join(ASSETS, 'blocks', 'whatsapp-contact');
  const blocksDest = path.join(PROJECT_ROOT, 'blocks', 'whatsapp-contact');
  if (fs.existsSync(blocksSrc)) {
    copyDirRecursive(blocksSrc, blocksDest);
    console.log('storefront-whatsapp-contact: copied blocks/whatsapp-contact');
  }

  const scriptConfig = path.join(ASSETS, 'scripts', 'whatsapp-config.js');
  if (fs.existsSync(scriptConfig)) {
    copyFile(scriptConfig, path.join(PROJECT_ROOT, 'scripts', 'whatsapp-config.js'));
    console.log('storefront-whatsapp-contact: copied scripts/whatsapp-config.js');
  }

  const initializerSrc = path.join(ASSETS, 'scripts', 'initializers', 'whatsapp.js');
  const initializerDest = path.join(PROJECT_ROOT, 'scripts', 'initializers', 'whatsapp.js');
  if (fs.existsSync(initializerSrc)) {
    ensureDir(path.dirname(initializerDest));
    copyFile(initializerSrc, initializerDest);
    console.log('storefront-whatsapp-contact: copied scripts/initializers/whatsapp.js');
    addWhatsAppToInitializers();
  }

  const iconsDir = path.join(ASSETS, 'icons');
  const projectIcons = path.join(PROJECT_ROOT, 'icons');
  if (fs.existsSync(iconsDir)) {
    ensureDir(projectIcons);
    const icons = fs.readdirSync(iconsDir).filter((f) => f.endsWith('.svg'));
    icons.forEach((name) => copyFile(path.join(iconsDir, name), path.join(projectIcons, name)));
    console.log('storefront-whatsapp-contact: copied icons', icons.join(', '));
  }

  console.log('storefront-whatsapp-contact: install complete. Configure whatsapp.graphql-endpoint (see README).');
}

main();
