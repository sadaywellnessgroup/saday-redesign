/**
 * Patches the phase2 screens JSON and creates a checkpoint that marks
 * only successfully-captured screens as done — so the next phase 2 run
 * re-scans only the failed/empty screens with their corrected URLs.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const REPORTS    = path.join(__dirname, 'output', 'reports');
const CHECKPOINT = path.join(__dirname, '.checkpoint.json');

// Load the existing screens file
const screenFiles = fs.readdirSync(REPORTS).filter(f => f.endsWith('_screens.json'));
if (!screenFiles.length) { console.log('No screens file found.'); process.exit(1); }

const screensPath = path.join(REPORTS, screenFiles[0]);
const allScreens  = JSON.parse(fs.readFileSync(screensPath, 'utf8'));

// A screen is "good" if it has buttons > 0 (meaning it actually rendered)
const goodScreens   = allScreens.filter(s => s.designAudit?.components?.buttons > 0);
const failedScreens = allScreens.filter(s => !(s.designAudit?.components?.buttons > 0));

console.log(`Good screens: ${goodScreens.length}`);
console.log(`Failed screens to re-scan: ${failedScreens.length}`);
failedScreens.forEach(s => console.log(`  - ${s.module} > ${s.screen} (${s.url})`));

// Build completedScreens set from only the good ones
const completedScreens = goodScreens.map(s => `${s.module}__${s.screen}`);

// Write a checkpoint that tells scanner.js to skip good screens
// and re-capture the failed ones
const checkpoint = {
  phase: 2,
  moduleName: null,
  allModules: true,
  targets: [...new Set(allScreens.map(s => s.module))],
  allScreenData:   goodScreens,
  allFeatures:     [],
  allFields:       [],
  allIntegrations: [],
  completedScreens,
  lastScreen: 'patched by fix-failed-screens.js',
  savedAt: new Date().toISOString(),
};

fs.writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));
console.log(`\n✅ Checkpoint written. ${completedScreens.length} screens marked done, ${failedScreens.length} will be re-scanned.`);
console.log('\nNow run: node scanner.js --resume');
