#!/usr/bin/env node

/**
 * Kiosk Build Script
 *
 * This script builds the kiosk version of the app for Capacitor.
 * It temporarily swaps the entry point to use index-kiosk.js instead of index.js
 *
 * Usage: npm run build:kiosk
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '..', 'src');
const indexPath = path.join(srcDir, 'index.js');
const kioskIndexPath = path.join(srcDir, 'index-kiosk.js');
const backupPath = path.join(srcDir, 'index.js.backup');

console.log('🔧 Building Chatters Kiosk App...\n');

try {
  // 1. Backup original index.js
  console.log('📦 Backing up original index.js...');
  fs.copyFileSync(indexPath, backupPath);

  // 2. Replace index.js with kiosk version
  console.log('🔄 Swapping to kiosk entry point...');
  fs.copyFileSync(kioskIndexPath, indexPath);

  // 3. Run the build
  console.log('🏗️  Running production build...\n');
  execSync('npm run build', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('\n✅ Kiosk build complete!');
  console.log('\nNext steps:');
  console.log('  1. Run: npx cap sync');
  console.log('  2. For iOS: npx cap open ios');
  console.log('  3. For Android: npx cap open android');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // 4. Restore original index.js
  console.log('\n🔄 Restoring original index.js...');
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, indexPath);
    fs.unlinkSync(backupPath);
  }
}
