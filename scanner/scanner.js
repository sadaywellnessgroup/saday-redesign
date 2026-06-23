/**
 * Multi-CRM Admin Scanner
 *
 * Systematically screenshots and documents every screen in a target CRM.
 * Outputs structured JSON (sitemap, screens, features, data-fields, integrations)
 * that matches the capture workbook schemas in ../docs/.
 *
 * Usage:
 *   node scanner.js --crm tealfeed --auth                         # One-time login, saves session
 *   node scanner.js --crm tealfeed --phase 1                      # Reconnaissance: map all nav items
 *   node scanner.js --crm tealfeed --phase 2 --module "Calendar"  # Deep-capture one module
 *   node scanner.js --crm tealfeed --phase 2 --all-modules        # Deep-capture everything found in phase 1
 *   node scanner.js --crm swasthmind --auth                       # SwasthMind: one-time login
 *   node scanner.js --crm swasthmind --phase 1                    # SwasthMind: reconnaissance
 *   node scanner.js --resume                                       # Resume from last checkpoint
 *
 * --crm defaults to "tealfeed" for backwards compatibility.
 *
 * Safety rules (hardcoded — not configurable):
 *   - Never clicks destructive buttons (Send, Submit, Sign, Delete, etc.)
 *   - Opens Create/Edit forms to reveal fields, then always Cancels/Esc
 *   - Never submits data, never modifies records
 *   - Checks for PAUSE signal from monitor.js every screen — pauses and resumes automatically
 *   - Saves a checkpoint after every screen so it can resume mid-scan
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Per-CRM config ───────────────────────────────────────────────────────────

const CRM_CONFIGS = {
  tealfeed: {
    baseUrl: 'https://app.tealfeed.com',
    name: 'Tealfeed',
    knownRoutes: [
      { label: 'Home',         href: '/' },
      { label: 'Calendar',     href: '/calendar' },
      { label: '1-1 Connect',  href: '/sessions' },
      { label: 'Bundles',      href: '/bundles' },
      { label: 'Events',       href: '/events' },
      { label: 'Clients',      href: '/clients' },
      { label: 'Availability', href: '/availability' },
      { label: 'Payments',     href: '/payments' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'My Blogs',     href: '/blogs' },
      { label: 'Admin Panel',  href: '/admin' },
    ],
    integrationVendors: {
      'Google Calendar': 'Calendar', 'Google Meet': 'Conferencing', 'Zoom': 'Conferencing',
      'MSG91': 'Communication', 'Twilio': 'Communication', 'WhatsApp': 'Communication',
      'Mailchimp': 'Email', 'Slack': 'Internal comms', 'Razorpay': 'Payment',
      'Stripe': 'Payment', 'PayPal': 'Payment', 'Easebuzz': 'Payment',
      'YouTube': 'Video', 'Vimeo': 'Video', 'Calendly': 'Scheduling',
    },
  },
  swasthmind: {
    baseUrl: 'https://crm.swasthmind.com',
    name: 'SwasthMind CRM',
    knownRoutes: [
      { label: 'Dashboard',                   href: '/dashboard' },
      { label: 'Conversations',               href: '/my-conversations' },
      { label: 'My Schedule',                 href: '/my-schedule' },
      { label: 'My Therapists',               href: '/my-therapists' },
      { label: 'Manual Booking',              href: '/manual-booking' },
      { label: 'Upcoming Sessions',           href: '/upcoming-sessions' },
      { label: 'Completed Sessions',          href: '/completed-sessions' },
      { label: 'Session Packages',            href: '/session-packages' },
      { label: 'Session Discounts',           href: '/session-discounts' },
      { label: 'Purchased Packages',          href: '/purchased-packages' },
      { label: 'Automated Reports',           href: '/automated-reports' },
      { label: 'Manual Assessments',          href: '/manual-assessments' },
      { label: 'My Clients',                  href: '/my-clients' },
      { label: 'Reports',                     href: '/my-report' },
      { label: 'Seminars',                    href: '/seminars' },
      { label: 'Job Listings',                href: '/job-listings' },
      { label: 'Applications',                href: '/job-applications' },
      { label: 'Ecommerce',                   href: '/ecommerce' },
      { label: 'Cancellation & Reschedule',   href: '/cancellation-reschedule' },
      { label: 'Manage Flows',                href: '/manage-flows' },
      { label: 'Submissions',                 href: '/submissions' },
      { label: 'Message Templates',           href: '/message-templates' },
      { label: 'Message Logs',                href: '/message-logs' },
      { label: 'Bulk Message Plans',          href: '/bulk-message-plans' },
      { label: 'Receptionists',               href: '/receptionists' },
      { label: 'Accountants',                 href: '/accountants' },
      { label: 'Co-Admins',                   href: '/co-admins' },
      { label: 'Branch Admins',               href: '/branch-admins' },
      { label: 'Branches',                    href: '/branches' },
      { label: 'Access Control',              href: '/rbac-config' },
      { label: 'Invoices',                    href: '/invoices' },
      { label: 'Profile',                     href: '/profile' },
    ],
    integrationVendors: {
      'WhatsApp': 'Messaging', 'Meta': 'Messaging', 'Razorpay': 'Payment',
      'Easebuzz': 'Payment', 'Stripe': 'Payment', 'PayPal': 'Payment',
      'Google Meet': 'Conferencing', 'Zoom': 'Conferencing', 'Google Maps': 'Maps',
      'YouTube': 'Video', 'Vimeo': 'Video', 'Twilio': 'Communication',
      'SendGrid': 'Email', 'Mailgun': 'Email', 'AWS SES': 'Email',
    },
  },
};

// ─── Resolve CRM from CLI args ────────────────────────────────────────────────

const _rawArgs = process.argv.slice(2);
const _crmIdx  = _rawArgs.indexOf('--crm');
const _crmKey  = (_crmIdx !== -1 ? _rawArgs[_crmIdx + 1] : 'tealfeed').toLowerCase();

if (!CRM_CONFIGS[_crmKey]) {
  console.error(`Unknown --crm "${_crmKey}". Available: ${Object.keys(CRM_CONFIGS).join(', ')}`);
  process.exit(1);
}

const CRM = CRM_CONFIGS[_crmKey];
const BASE_URL = CRM.baseUrl;

const SESSION_PATH    = path.join(__dirname, `.session_${_crmKey}`);
const OUTPUT_DIR      = path.join(__dirname, 'output', _crmKey);
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const REPORTS_DIR     = path.join(OUTPUT_DIR, 'reports');
// Raw JSON written here; markdown reports written to REPORTS_DIR by report.js
const DATA_DIR        = path.join(REPORTS_DIR, 'data');

// Written by monitor.js when Claude usage is low — scanner polls this
const PAUSE_FILE      = path.join(__dirname, '.PAUSE');
// Written by monitor.js with { resumeAt: ISO-string } so scanner knows when to wake
const RESUME_FILE     = path.join(__dirname, '.RESUME_AT');
// Scanner writes progress here after every screen so it can resume mid-scan
const CHECKPOINT_FILE = path.join(__dirname, '.checkpoint.json');

// Buttons/links we must NEVER click
const DESTRUCTIVE_PATTERNS = [
  /\bsend\b/i, /\bsubmit\b/i, /\bsign\b/i, /\block\b/i,
  /\bpost\b/i, /\bprescribe\b/i, /\btransmit\b/i, /\bfax\b/i,
  /\bdelete\b/i, /\barchive\b/i, /\bdeactivate\b/i, /\bremove\b/i,
  /\bconfirm payment\b/i, /\brefund\b/i, /\brelease\b/i,
  /\bexport\b/i, /\bimport\b/i, /\bmerge\b/i, /\bbulk.?update\b/i,
  /\bcancel appointment\b/i, /\bbook appointment\b/i,
];

// Buttons that open forms/modals (safe to click — we cancel after)
const FORM_OPENER_PATTERNS = [
  /\bcreate\b/i, /\bnew\b/i, /\badd\b/i, /\bedit\b/i,
  /\bconfigure\b/i, /\bcustomize\b/i, /\bsetup\b/i,
];

// Selectors for "cancel" / "close" / escape paths in modals
const CANCEL_SELECTORS = [
  'button:has-text("Cancel")',
  'button:has-text("Close")',
  'button:has-text("Discard")',
  '[aria-label="Close"]',
  '[aria-label="close"]',
  '.modal-close',
  '.dialog-close',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slug(text) {
  return text.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

function ssPath(parts) {
  const name = parts.map(slug).join('__') + '.png';
  return path.join(SCREENSHOTS_DIR, name);
}

function log(msg) {
  const ts = new Date().toISOString().substring(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function warn(msg) {
  console.warn(`[WARN] ${msg}`);
}

function isDestructive(text) {
  return DESTRUCTIVE_PATTERNS.some(re => re.test(text));
}

function isFormOpener(text) {
  return FORM_OPENER_PATTERNS.some(re => re.test(text));
}

async function safeScreenshot(page, filePath, label) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.screenshot({ path: filePath, fullPage: true });
    log(`  📸 ${label} → ${path.basename(filePath)}`);
    return path.basename(filePath);
  } catch (e) {
    warn(`Screenshot failed for ${label}: ${e.message}`);
    return null;
  }
}

async function dismissModal(page) {
  for (const sel of CANCEL_SELECTORS) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click();
        await page.waitForTimeout(400);
        return true;
      }
    } catch {}
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  return false;
}

// ─── Checkpoint / resume ──────────────────────────────────────────────────────

function saveCheckpoint(state) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ ...state, savedAt: new Date().toISOString() }, null, 2));
}

function loadCheckpoint() {
  if (!fs.existsSync(CHECKPOINT_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function clearCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE);
}

// ─── Usage / pause guard ──────────────────────────────────────────────────────

/**
 * Called between every screen. If monitor.js has written a PAUSE file,
 * this blocks until the resume time, then returns so scanning continues.
 *
 * The scanner never exits on pause — it sleeps in-process so Playwright
 * keeps the browser session warm and resumes without re-launching.
 */
async function waitIfPaused(checkpoint) {
  if (!fs.existsSync(PAUSE_FILE)) return;

  let resumeAt = null;
  if (fs.existsSync(RESUME_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(RESUME_FILE, 'utf8'));
      resumeAt = new Date(data.resumeAt);
    } catch {}
  }

  const resumeStr = resumeAt ? resumeAt.toLocaleTimeString() : 'unknown';
  log(`\n⏸️  PAUSED — Claude usage is low.`);
  log(`   Checkpoint saved at screen: ${checkpoint?.lastScreen || 'start'}`);
  log(`   Will resume at: ${resumeStr}`);
  log(`   (monitor.js will remove .PAUSE when it is safe to continue)\n`);

  // Poll every 30 seconds until the PAUSE file is gone
  while (fs.existsSync(PAUSE_FILE)) {
    const now = new Date();
    if (resumeAt && now >= resumeAt) {
      // Resume time has passed — remove pause file ourselves if monitor didn't
      log('Resume time reached — continuing scan.');
      fs.unlinkSync(PAUSE_FILE);
      if (fs.existsSync(RESUME_FILE)) fs.unlinkSync(RESUME_FILE);
      break;
    }
    await new Promise(r => setTimeout(r, 30_000)); // sleep 30 s
  }

  log('▶️  Resumed.\n');
}

// ─── Browser / session management ────────────────────────────────────────────

async function launchBrowser(headless = true) {
  const contextOptions = {
    viewport: { width: 1440, height: 900 },
  };

  if (fs.existsSync(SESSION_PATH)) {
    contextOptions.storageState = SESSION_PATH;
  }

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  page.on('dialog', async dialog => {
    log(`  [Dialog] type=${dialog.type()} msg=${dialog.message()}`);
    await dialog.dismiss();
  });

  return { browser, context, page };
}

async function saveSession(context) {
  await context.storageState({ path: SESSION_PATH });
  log('Session saved to .session');
}

// ─── Auth mode ────────────────────────────────────────────────────────────────

async function runAuth() {
  log(`Opening browser — please log into ${BASE_URL} (${CRM.name}) as admin, then press Enter here.`);
  const { browser, context, page } = await launchBrowser(false);

  await page.goto(BASE_URL);
  log('Browser open. Log in, then come back here and press Enter.');

  await new Promise(resolve => {
    process.stdin.setRawMode(false);
    process.stdin.resume();
    process.stdin.once('data', () => resolve());
    console.log('\nPress Enter when logged in...');
  });

  await saveSession(context);
  await browser.close();
  log(`Auth complete. Run: node scanner.js --crm ${_crmKey} --phase 1`);
}

// ─── Phase 1 — Reconnaissance ────────────────────────────────────────────────

async function runPhase1(resumeFrom) {
  log('=== PHASE 1: Reconnaissance ===');
  if (resumeFrom) log(`Resuming from checkpoint: ${resumeFrom.lastScreen}`);

  const { browser, context, page } = await launchBrowser(true);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  const currentUrl = page.url();
  if (currentUrl.includes('login') || currentUrl.includes('signin')) {
    log('Not logged in. Run: node scanner.js --auth first.');
    await browser.close();
    return;
  }

  log(`Landed at: ${currentUrl}`);

  const sitemap = resumeFrom?.sitemap || [];
  let screenshotIndex = resumeFrom?.screenshotIndex || 1;
  const completedScreens = new Set(resumeFrom?.completedScreens || []);

  // Dashboard (skip if resuming)
  if (!completedScreens.has('Dashboard')) {
    const dashSS = ssPath(['phase1', '00_dashboard']);
    await safeScreenshot(page, dashSS, 'Dashboard');
    sitemap.push({
      index: screenshotIndex++,
      module: 'Home', submenu: '—', screen: 'Dashboard',
      url: page.url(), purpose: '', screenshot: path.basename(dashSS), navPath: [],
    });
    completedScreens.add('Dashboard');
    saveCheckpoint({ phase: 1, sitemap, screenshotIndex, completedScreens: [...completedScreens], lastScreen: 'Dashboard' });
  }

  log('Discovering top-level navigation...');
  const navItems = await discoverNavItems(page);
  log(`Found ${navItems.length} top-level nav items: ${navItems.map(n => n.label).join(', ')}`);

  for (const navItem of navItems) {
    // Skip already-completed items when resuming
    if (completedScreens.has(navItem.label)) {
      log(`Skipping (already captured): ${navItem.label}`);
      continue;
    }

    // Pause check — runs between each nav item
    await waitIfPaused({ phase: 1, sitemap, screenshotIndex, completedScreens: [...completedScreens], lastScreen: navItem.label });

    log(`\nNavigating to: ${navItem.label}`);

    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      // Navigate by href if available (most reliable), otherwise click by text
      let clicked = false;
      if (navItem.href && navItem.href !== '/' && navItem.href.startsWith('/')) {
        await page.goto(BASE_URL + navItem.href, { waitUntil: 'domcontentloaded' });
        clicked = true;
      } else {
        // Try clicking by exact text match in sidebar area — avoids Radix ID issues
        const el = page.locator(`a:has-text("${navItem.label}"), button:has-text("${navItem.label}")`).first();
        if (await el.isVisible({ timeout: 3000 })) {
          await el.click();
          clicked = true;
        }
      }
      if (!clicked) {
        warn(`Could not navigate to: ${navItem.label}`);
        continue;
      }
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(600);

      const url = page.url();
      const ss = ssPath(['phase1', `${String(screenshotIndex).padStart(2, '0')}_${navItem.label}`]);
      const ssFile = await safeScreenshot(page, ss, navItem.label);
      const heading = await page.locator('h1, h2, [class*="title"], [class*="heading"]').first().textContent({ timeout: 1000 }).catch(() => '');

      sitemap.push({
        index: screenshotIndex++,
        module: navItem.label, submenu: '—',
        screen: heading?.trim() || navItem.label,
        url, purpose: '', screenshot: ssFile, navPath: [navItem.label],
      });

      // Sub-nav
      const subItems = await discoverSubNav(page, navItem.label);
      for (const sub of subItems) {
        const subKey = `${navItem.label}__${sub.label}`;
        if (completedScreens.has(subKey)) continue;
        log(`  Sub-nav: ${sub.label}`);
        try {
          await sub.click(page);
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(500);

          const subSS = ssPath(['phase1', `${String(screenshotIndex).padStart(2, '0')}_${navItem.label}_${sub.label}`]);
          const subSSFile = await safeScreenshot(page, subSS, `${navItem.label} > ${sub.label}`);

          sitemap.push({
            index: screenshotIndex++,
            module: navItem.label, submenu: sub.label, screen: sub.label,
            url: page.url(), purpose: '', screenshot: subSSFile, navPath: [navItem.label, sub.label],
          });
          completedScreens.add(subKey);
        } catch (e) {
          warn(`Failed sub-nav ${sub.label}: ${e.message}`);
        }
      }

      completedScreens.add(navItem.label);
      saveCheckpoint({ phase: 1, sitemap, screenshotIndex, completedScreens: [...completedScreens], lastScreen: navItem.label });

    } catch (e) {
      warn(`Failed nav item ${navItem.label}: ${e.message}`);
    }
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const sitemapPath = path.join(DATA_DIR, 'phase1_sitemap.json');
  fs.writeFileSync(sitemapPath, JSON.stringify({ generatedAt: new Date().toISOString(), sitemap }, null, 2));
  log(`\n✅ Phase 1 complete. ${sitemap.length} screens captured.`);
  log(`Sitemap saved to: ${sitemapPath}`);
  printSitemapTable(sitemap);

  clearCheckpoint();
  await browser.close();
}

async function discoverNavItems(page) {
  // Dump sidebar HTML to file so we can inspect it if discovery fails
  const sidebarHtml = await page.evaluate(() => {
    const candidates = [
      document.querySelector('nav'),
      document.querySelector('aside'),
      document.querySelector('[class*="sidebar"]'),
      document.querySelector('[class*="Sidebar"]'),
      document.querySelector('[class*="side-nav"]'),
      document.querySelector('[class*="SideNav"]'),
      document.querySelector('[role="navigation"]'),
    ].filter(Boolean);
    return candidates.map(el => el.outerHTML.slice(0, 3000)).join('\n\n---\n\n');
  });

  if (sidebarHtml) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, 'debug_sidebar.html'), sidebarHtml);
    log(`Sidebar HTML dumped to output/${_crmKey}/reports/data/debug_sidebar.html`);
  }

  // Strategy 1: find all clickable elements in the left ~250px of the viewport
  // (where sidebars live) with short text — avoids Radix ID issues by using
  // text content for clicking rather than broken CSS selectors
  const candidates = await page.evaluate(() => {
    const seen = new Set();
    const items = [];

    // Cast a wide net across every element
    const allEls = [...document.querySelectorAll('a, button, [role="menuitem"], [role="link"], li')];

    for (const el of allEls) {
      const rect = el.getBoundingClientRect();
      // Must be in the left sidebar zone (x < 280) and visible
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.left > 280) continue;
      if (rect.top < 0 || rect.bottom < 0) continue;

      const text = el.textContent?.trim().split('\n')[0].trim(); // first line only
      if (!text || text.length > 40 || text.length < 2) continue;
      if (seen.has(text.toLowerCase())) continue;
      seen.add(text.toLowerCase());

      const href = el.getAttribute('href') || '';
      items.push({ label: text, href, tagName: el.tagName.toLowerCase() });
    }
    return items;
  });

  // Known routes for the selected CRM (from captured sitemap / Phase 1 docs)
  const knownRoutes = CRM.knownRoutes;

  // Merge: prefer discovered items, fall back to known routes for any missing
  const discoveredLabels = new Set(candidates.map(c => c.label.toLowerCase()));
  const skipWords = /logout|sign.?out|avatar|notification|help|support|what.?s new|create new/i;

  const merged = [
    ...candidates.filter(i => !skipWords.test(i.label)),
    ...knownRoutes.filter(r => !discoveredLabels.has(r.label.toLowerCase())),
  ].slice(0, 30);

  log(`Nav discovery: ${candidates.length} discovered, ${merged.length} after merge with known routes`);
  return merged;
}

async function discoverSubNav(page, parentLabel) {
  const subItems = await page.evaluate(() => {
    const selectors = [
      '[role="tab"]', '[class*="tab"] button', '[class*="tab"] a',
      '[class*="subtab"]', '[class*="sub-nav"]',
      '[class*="pill"] button', '[class*="chip"]',
    ];
    const seen = new Set();
    const items = [];
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const text = el.textContent?.trim();
        if (!text || text.length > 60 || text.length < 2) continue;
        if (seen.has(text.toLowerCase())) continue;
        seen.add(text.toLowerCase());
        items.push({ label: text });
      }
    }
    return items;
  });

  return subItems.map(item => ({
    label: item.label,
    click: async (pg) => {
      const el = pg.locator(`[role="tab"]:has-text("${item.label}"), button:has-text("${item.label}")`).first();
      await el.click();
    },
  }));
}

function printSitemapTable(sitemap) {
  console.log('\n## Sitemap — Phase 1 Output\n');
  console.log('| # | Module | Submenu | Screen | URL | Screenshot |');
  console.log('|---|--------|---------|--------|-----|------------|');
  for (const row of sitemap) {
    console.log(`| ${row.index} | ${row.module} | ${row.submenu} | ${row.screen} | ${row.url} | ${row.screenshot || '—'} |`);
  }
}

// ─── Phase 2 — Deep capture ───────────────────────────────────────────────────

async function runPhase2(moduleName, allModules, resumeFrom) {
  const sitemapPath = path.join(DATA_DIR, 'phase1_sitemap.json');
  if (!fs.existsSync(sitemapPath)) {
    log(`Run phase 1 first: node scanner.js --crm ${_crmKey} --phase 1`);
    return;
  }

  const { sitemap } = JSON.parse(fs.readFileSync(sitemapPath, 'utf8'));
  let targets;
  if (allModules) {
    targets = [...new Set(sitemap.map(s => s.module))];
    log(`Deep-capturing all ${targets.length} modules: ${targets.join(', ')}`);
  } else {
    targets = [moduleName];
    log(`Deep-capturing module: ${moduleName}`);
  }

  if (resumeFrom) {
    log(`Resuming from checkpoint: last screen was "${resumeFrom.lastScreen}"`);
  }

  const { browser, context, page } = await launchBrowser(true);

  const allScreenData    = resumeFrom?.allScreenData    || [];
  const allFeatures      = resumeFrom?.allFeatures      || [];
  const allFields        = resumeFrom?.allFields        || [];
  const allIntegrations  = resumeFrom?.allIntegrations  || [];
  const completedScreens = new Set(resumeFrom?.completedScreens || []);

  for (const target of targets) {
    const moduleScreens = sitemap.filter(s => s.module === target);
    if (!moduleScreens.length) {
      warn(`No screens found for module: ${target}`);
      continue;
    }

    log(`\n=== MODULE: ${target} (${moduleScreens.length} screens) ===`);
    const moduleDir = path.join(SCREENSHOTS_DIR, slug(target));
    fs.mkdirSync(moduleDir, { recursive: true });

    for (const screen of moduleScreens) {
      if (!screen.url || screen.url === BASE_URL) continue;

      const screenKey = `${target}__${screen.screen}`;

      // Skip already-completed screens when resuming
      if (completedScreens.has(screenKey)) {
        log(`  Skipping (already captured): ${screen.screen}`);
        continue;
      }

      // ── Pause check — runs before every single screen ──
      const checkpoint = {
        phase: 2, moduleName, allModules, targets,
        allScreenData, allFeatures, allFields, allIntegrations,
        completedScreens: [...completedScreens],
        lastScreen: screen.screen,
      };
      await waitIfPaused(checkpoint);

      log(`\n  Screen: ${screen.screen} → ${screen.url}`);

      try {
        await page.goto(screen.url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(800);

        const ssFile = path.join(moduleDir, `${slug(screen.screen)}__full.png`);
        await safeScreenshot(page, ssFile, `${target} > ${screen.screen}`);

        const screenData     = await captureScreenData(page, screen, target);
        screenData.screenshot = path.relative(OUTPUT_DIR, ssFile);
        allScreenData.push(screenData);

        const features      = await captureFeatures(page, target, screen.screen);
        allFeatures.push(...features);

        const fields        = await captureVisibleFields(page, target, screen.screen);
        allFields.push(...fields);

        const integrations  = await captureIntegrations(page, target, screen.screen);
        allIntegrations.push(...integrations);

        const formData      = await captureFormFields(page, moduleDir, target, screen.screen);
        allFields.push(...formData.fields);
        allScreenData[allScreenData.length - 1].forms = formData.forms;

        // Design audit — runs on every screen
        const designAudit   = await captureDesignAudit(page, target, screen.screen);
        allScreenData[allScreenData.length - 1].designAudit = designAudit;

        await captureTabScreenshots(page, moduleDir, target, screen.screen, screenData);

      } catch (e) {
        warn(`Error processing screen ${screen.screen}: ${e.message}`);
      }

      // ── Checkpoint after every screen ──
      completedScreens.add(screenKey);
      saveCheckpoint({
        phase: 2, moduleName, allModules, targets,
        allScreenData, allFeatures, allFields, allIntegrations,
        completedScreens: [...completedScreens],
        lastScreen: screen.screen,
      });

      // Flush partial reports so data is never lost mid-scan
      flushReports(targets, allScreenData, allFeatures, allFields, allIntegrations);
    }
  }

  flushReports(targets, allScreenData, allFeatures, allFields, allIntegrations);

  log(`\n✅ Phase 2 complete.`);
  log(`  Screens:      ${allScreenData.length}`);
  log(`  Features:     ${allFeatures.length}`);
  log(`  Fields:       ${allFields.length}`);
  log(`  Integrations: ${allIntegrations.length}`);

  printPhase2Summary(allScreenData, allFeatures, allFields, allIntegrations);
  clearCheckpoint();
  await browser.close();
}

// ─── Design audit ─────────────────────────────────────────────────────────────

async function captureDesignAudit(page, moduleName, screenName) {
  const audit = await page.evaluate(() => {
    // ── Helpers ──────────────────────────────────────────────────────────────

    function getComputedVal(el, prop) {
      try { return window.getComputedStyle(el).getPropertyValue(prop).trim(); } catch { return ''; }
    }

    function contrastRatio(hex1, hex2) {
      function luminance(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        const toLinear = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
      }
      try {
        const l1 = luminance(hex1); const l2 = luminance(hex2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      } catch { return null; }
    }

    function rgbToHex(rgb) {
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return null;
      return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
    }

    // ── Colors ───────────────────────────────────────────────────────────────

    const colorCounts = {};
    const bgCounts = {};
    const allEls = [...document.querySelectorAll('*')].slice(0, 500); // cap for perf

    for (const el of allEls) {
      const color = rgbToHex(getComputedVal(el, 'color'));
      const bg    = rgbToHex(getComputedVal(el, 'background-color'));
      if (color && color !== '#000000' && color !== '#ffffff') colorCounts[color] = (colorCounts[color] || 0) + 1;
      if (bg && bg !== '#000000' && bg !== '#ffffff' && bg !== '#00000000') bgCounts[bg] = (bgCounts[bg] || 0) + 1;
    }

    const topTextColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([hex, count]) => ({ hex, count }));
    const topBgColors   = Object.entries(bgCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([hex, count]) => ({ hex, count }));

    // ── Typography ───────────────────────────────────────────────────────────

    const fontFamilies = new Set();
    const fontSizes    = {};
    const fontWeights  = new Set();

    for (const el of document.querySelectorAll('p, span, h1, h2, h3, h4, button, a, label, td, th')) {
      const ff = getComputedVal(el, 'font-family').split(',')[0].replace(/['"]/g, '').trim();
      const fs = getComputedVal(el, 'font-size');
      const fw = getComputedVal(el, 'font-weight');
      if (ff) fontFamilies.add(ff);
      if (fs) fontSizes[fs] = (fontSizes[fs] || 0) + 1;
      if (fw && fw !== 'normal' && fw !== '400') fontWeights.add(fw);
    }

    const topFontSizes = Object.entries(fontSizes).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([size, count]) => ({ size, count }));

    // ── Spacing / layout ─────────────────────────────────────────────────────

    const body      = document.body;
    const mainEl    = document.querySelector('main, [class*="main"], [class*="content"], [class*="page"]');
    const sidebarEl = document.querySelector('[class*="sidebar"], [class*="side-nav"], aside, nav');

    const layoutType = sidebarEl && mainEl ? 'sidebar + main'
      : mainEl ? 'main content only'
      : 'unknown';

    // Detect grid/flex usage
    let gridCount = 0, flexCount = 0;
    for (const el of allEls) {
      const display = getComputedVal(el, 'display');
      if (display === 'grid') gridCount++;
      if (display === 'flex') flexCount++;
    }

    // Common spacing values on cards/panels
    const cards = document.querySelectorAll('[class*="card"], [class*="panel"], [class*="widget"]');
    const cardPaddings = [...cards].slice(0, 5).map(c => getComputedVal(c, 'padding')).filter(Boolean);

    // ── Components ────────────────────────────────────────────────────────────

    const components = {
      buttons:       document.querySelectorAll('button, [role="button"]').length,
      inputs:        document.querySelectorAll('input, select, textarea').length,
      tables:        document.querySelectorAll('table').length,
      cards:         document.querySelectorAll('[class*="card"], [class*="panel"]').length,
      modals:        document.querySelectorAll('[role="dialog"], [class*="modal"]').length,
      icons:         document.querySelectorAll('svg, [class*="icon"]').length,
      badges:        document.querySelectorAll('[class*="badge"], [class*="chip"], [class*="tag"]').length,
      tooltips:      document.querySelectorAll('[title], [data-tooltip], [class*="tooltip"]').length,
      dropdowns:     document.querySelectorAll('[class*="dropdown"], [class*="select"], select').length,
      charts:        document.querySelectorAll('[class*="chart"], [class*="graph"], canvas, svg[class*="recharts"]').length,
      emptyStates:   document.querySelectorAll('[class*="empty"], [class*="no-data"], [class*="placeholder"]').length,
      loadingSpinner:document.querySelectorAll('[class*="spinner"], [class*="loading"], [class*="skeleton"]').length,
    };

    // Button style variants (primary, secondary, ghost, etc.)
    const buttonClasses = new Set();
    for (const btn of document.querySelectorAll('button, [role="button"]')) {
      const cls = btn.className || '';
      const variant = cls.match(/\b(primary|secondary|ghost|outline|danger|success|warning|link|text|flat|contained|filled)\b/i)?.[1];
      if (variant) buttonClasses.add(variant.toLowerCase());
    }

    // ── Accessibility ─────────────────────────────────────────────────────────

    const imgsMissingAlt = [...document.querySelectorAll('img')].filter(img => !img.getAttribute('alt')).length;
    const inputsMissingLabel = [...document.querySelectorAll('input, select, textarea')].filter(el => {
      const id = el.getAttribute('id');
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAria  = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      return !hasLabel && !hasAria;
    }).length;
    const interactivesMissingRole = [...document.querySelectorAll('[onclick], [class*="clickable"]')]
      .filter(el => !['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) && !el.getAttribute('role')).length;

    // Basic contrast check on body text vs background
    const bodyColor  = rgbToHex(getComputedVal(document.body, 'color'));
    const bodyBg     = rgbToHex(getComputedVal(document.body, 'background-color'));
    const bodyContrast = bodyColor && bodyBg ? contrastRatio(bodyColor, bodyBg) : null;

    // ── Design consistency signals ────────────────────────────────────────────

    const uniqueTextColors = Object.keys(colorCounts).length;
    const uniqueBgColors   = Object.keys(bgCounts).length;
    const uniqueFontSizes  = Object.keys(fontSizes).length;

    const consistencyIssues = [];
    if (uniqueTextColors > 10) consistencyIssues.push(`High color variance: ${uniqueTextColors} unique text colors`);
    if (uniqueFontSizes > 12)  consistencyIssues.push(`High type variance: ${uniqueFontSizes} unique font sizes`);
    if (imgsMissingAlt > 0)    consistencyIssues.push(`${imgsMissingAlt} image(s) missing alt text`);
    if (inputsMissingLabel > 0) consistencyIssues.push(`${inputsMissingLabel} input(s) missing label`);
    if (bodyContrast !== null && bodyContrast < 4.5) consistencyIssues.push(`Body text contrast ratio ${bodyContrast.toFixed(2)} below WCAG AA (4.5)`);

    return {
      colors: { topTextColors, topBgColors, uniqueTextColors, uniqueBgColors },
      typography: {
        fontFamilies: [...fontFamilies],
        topFontSizes,
        fontWeights: [...fontWeights],
        uniqueFontSizeCount: uniqueFontSizes,
      },
      layout: {
        type: layoutType,
        flexCount,
        gridCount,
        cardPaddings: [...new Set(cardPaddings)],
      },
      components,
      buttonVariants: [...buttonClasses],
      accessibility: {
        imgsMissingAlt,
        inputsMissingLabel,
        interactivesMissingRole,
        bodyContrastRatio: bodyContrast ? parseFloat(bodyContrast.toFixed(2)) : null,
        bodyColor,
        bodyBg,
      },
      consistencyIssues,
    };
  });

  log(`  🎨 Design audit: ${audit.components.buttons} btns, ${audit.typography.fontFamilies.length} fonts, ${audit.colors.uniqueTextColors} text colors, ${audit.consistencyIssues.length} issues`);
  return { module: moduleName, screen: screenName, ...audit };
}

function flushReports(targets, screens, features, fields, integrations) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const base = path.join(DATA_DIR, `phase2_${targets.map(slug).join('_')}`);
  fs.writeFileSync(`${base}_screens.json`,      JSON.stringify(screens, null, 2));
  fs.writeFileSync(`${base}_features.json`,     JSON.stringify(features, null, 2));
  fs.writeFileSync(`${base}_fields.json`,       JSON.stringify(fields, null, 2));
  fs.writeFileSync(`${base}_integrations.json`, JSON.stringify(integrations, null, 2));
}

async function captureScreenData(page, screen, moduleName) {
  const data = await page.evaluate(() => {
    const headings = [...document.querySelectorAll('h1,h2,h3')].map(el => el.textContent?.trim()).filter(Boolean);
    const tables = [...document.querySelectorAll('table')].map(table => ({
      headers: [...table.querySelectorAll('th')].map(th => th.textContent?.trim()),
    }));
    const buttons = [...document.querySelectorAll('button, [role="button"], a.btn, [class*="btn"]')]
      .map(el => el.textContent?.trim()).filter(t => t && t.length < 80);
    const filters = [...document.querySelectorAll('select, input[type="search"], [class*="filter"], [class*="search"]')]
      .map(el => el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.getAttribute('name') || '')
      .filter(Boolean);
    const tabs = [...document.querySelectorAll('[role="tab"], [class*="tab"] button')]
      .map(el => el.textContent?.trim()).filter(Boolean);
    return { headings, tables, buttons: [...new Set(buttons)], filters: [...new Set(filters)], tabs };
  });

  const destructiveCheck = (t) => DESTRUCTIVE_PATTERNS.some(re => re.test(t));

  return {
    module: moduleName,
    screen: screen.screen,
    submenu: screen.submenu,
    url: screen.url,
    headings: data.headings,
    tabs: data.tabs,
    tables: data.tables,
    actionsAvailable: data.buttons.filter(b => !destructiveCheck(b)),
    flaggedDestructive: data.buttons.filter(b => destructiveCheck(b)),
    filters: data.filters,
    notes: '',
    forms: [],
    screenshot: '',
  };
}

async function captureFeatures(page, moduleName, screenName) {
  const buttons = await page.$$eval('button, [role="button"]', els =>
    els.map(el => el.textContent?.trim()).filter(t => t && t.length < 80)
  );
  return buttons.filter(b => b && b.length > 2).map(b => ({
    module: moduleName, feature: screenName, subCapability: b,
    present: 'Yes', quality: '', notes: '',
  }));
}

async function captureVisibleFields(page, moduleName, screenName) {
  return page.evaluate((args) => {
    const { moduleName, screenName } = args;
    const fields = [];
    for (const el of document.querySelectorAll('input, select, textarea, [class*="input"], [class*="field"]')) {
      const label = el.getAttribute('aria-label')
        || el.getAttribute('placeholder')
        || el.getAttribute('name')
        || el.getAttribute('id')
        || el.closest('label')?.textContent?.trim()
        || el.previousElementSibling?.textContent?.trim()
        || '';
      if (!label || label.length > 100) continue;
      const type = el.tagName.toLowerCase() === 'select' ? 'enum'
        : el.tagName.toLowerCase() === 'textarea' ? 'text'
        : el.getAttribute('type') || 'string';
      const enumVals = el.tagName.toLowerCase() === 'select'
        ? [...el.querySelectorAll('option')].map(o => o.textContent?.trim()).join(', ')
        : '';
      fields.push({ entity: moduleName, field: label, type, required: el.hasAttribute('required') ? 'Yes' : 'Unknown', enumValues: enumVals, phi: 'Unknown', sourceScreen: screenName, notes: '' });
    }
    return fields;
  }, { moduleName, screenName });
}

async function captureFormFields(page, moduleDir, moduleName, screenName) {
  const forms = [];
  const fields = [];
  const buttons = await page.$$('button, [role="button"], a');
  const formOpeners = [];

  for (const btn of buttons) {
    try {
      const text = await btn.textContent();
      const trimmed = text?.trim();
      if (!trimmed || trimmed.length > 60) continue;
      if (isFormOpener(trimmed) && !isDestructive(trimmed)) {
        formOpeners.push({ text: trimmed, el: btn });
      }
    } catch {}
  }

  log(`  Found ${formOpeners.length} form opener(s): ${formOpeners.map(f => f.text).join(', ')}`);

  for (const opener of formOpeners.slice(0, 5)) {
    try {
      log(`  Opening form: "${opener.text}"...`);
      await opener.el.click();
      await page.waitForTimeout(800);

      const modalVisible = await page.locator('[role="dialog"], [class*="modal"], [class*="drawer"], [class*="overlay"]').first().isVisible({ timeout: 2000 }).catch(() => false);

      if (modalVisible) {
        const formSS = path.join(moduleDir, `${slug(screenName)}__form_${slug(opener.text)}.png`);
        await safeScreenshot(page, formSS, `Form: ${opener.text}`);

        const formFields = await page.evaluate((args) => {
          const { moduleName, formName } = args;
          const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="drawer"]');
          if (!modal) return [];
          return [...modal.querySelectorAll('input, select, textarea')].map(el => {
            const label = el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('name') || el.getAttribute('id') || el.closest('label')?.textContent?.trim() || el.previousElementSibling?.textContent?.trim() || '';
            const type = el.tagName.toLowerCase() === 'select' ? 'enum' : el.tagName.toLowerCase() === 'textarea' ? 'text' : el.getAttribute('type') || 'string';
            const enumVals = el.tagName.toLowerCase() === 'select' ? [...el.querySelectorAll('option')].map(o => o.textContent?.trim()).join(', ') : '';
            return { entity: moduleName, field: label, type, required: el.hasAttribute('required') ? 'Yes' : 'Unknown', enumValues: enumVals, phi: 'Unknown', sourceScreen: `Form: ${formName}`, notes: '' };
          }).filter(f => f.field.length > 0 && f.field.length < 100);
        }, { moduleName, formName: opener.text });

        fields.push(...formFields);
        forms.push({ trigger: opener.text, screenshot: path.relative(OUTPUT_DIR, formSS), fieldCount: formFields.length, fields: formFields.map(f => f.field) });

        log(`  Closing form (safety rule)...`);
        await dismissModal(page);
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press('Escape');
      }
    } catch (e) {
      warn(`Form capture failed for "${opener.text}": ${e.message}`);
      await page.keyboard.press('Escape');
    }
  }

  return { forms, fields };
}

async function captureTabScreenshots(page, moduleDir, moduleName, screenName, screenData) {
  for (const tab of (screenData.tabs || []).slice(0, 10)) {
    try {
      const tabEl = page.locator(`[role="tab"]:has-text("${tab}"), button:has-text("${tab}")`).first();
      if (!await tabEl.isVisible({ timeout: 1000 })) continue;
      await tabEl.click();
      await page.waitForTimeout(600);
      const tabSS = path.join(moduleDir, `${slug(screenName)}__tab_${slug(tab)}.png`);
      await safeScreenshot(page, tabSS, `${screenName} > Tab: ${tab}`);
    } catch {}
  }
}

async function captureIntegrations(page, moduleName, screenName) {
  const text = await page.textContent('body').catch(() => '');
  const vendorCategories = CRM.integrationVendors;
  const vendors = Object.keys(vendorCategories);
  return vendors
    .filter(v => text.toLowerCase().includes(v.toLowerCase()))
    .map(vendor => ({ module: moduleName, screen: screenName, vendor, category: vendorCategories[vendor] || 'Unknown', direction: 'Unknown', notes: 'Found on page' }));
}

function printPhase2Summary(screens, features, fields, integrations) {
  console.log('\n## Phase 2 Summary\n');
  console.log(`| Category | Count |`);
  console.log(`|----------|-------|`);
  console.log(`| Screens captured | ${screens.length} |`);
  console.log(`| Feature/action items | ${features.length} |`);
  console.log(`| Data fields | ${fields.length} |`);
  console.log(`| Integration references | ${integrations.length} |`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

// Load checkpoint for --resume or automatic resume detection
let resumeFrom = null;
if (args.includes('--resume')) {
  resumeFrom = loadCheckpoint();
  if (!resumeFrom) {
    log('No checkpoint found. Starting fresh.');
  } else {
    log(`Found checkpoint from ${resumeFrom.savedAt}, phase ${resumeFrom.phase}, last screen: "${resumeFrom.lastScreen}"`);
  }
}

if (args.includes('--auth')) {
  await runAuth();

} else if (args.includes('--resume') && resumeFrom) {
  if (resumeFrom.phase === 1) {
    await runPhase1(resumeFrom);
  } else if (resumeFrom.phase === 2) {
    await runPhase2(resumeFrom.moduleName, resumeFrom.allModules, resumeFrom);
  }

} else if (args.includes('--phase')) {
  const phaseIdx = args.indexOf('--phase');
  const phase = parseInt(args[phaseIdx + 1]);

  if (phase === 1) {
    await runPhase1(null);
  } else if (phase === 2) {
    const allModules = args.includes('--all-modules');
    const moduleIdx  = args.indexOf('--module');
    const moduleName = moduleIdx !== -1 ? args[moduleIdx + 1] : null;

    if (!allModules && !moduleName) {
      log('Specify a module: node scanner.js --phase 2 --module "Calendar"');
      log('Or scan all:      node scanner.js --phase 2 --all-modules');
    } else {
      await runPhase2(moduleName, allModules, null);
    }
  }

} else {
  console.log(`
Multi-CRM Admin Scanner  (current target: ${CRM.name} — ${BASE_URL})

Commands:
  node scanner.js --crm tealfeed   --auth                          Log in to Tealfeed
  node scanner.js --crm swasthmind --auth                          Log in to SwasthMind
  node scanner.js --crm <name>     --phase 1                       Reconnaissance: map all nav + screenshot
  node scanner.js --crm <name>     --phase 2 --module "Sessions"   Deep-capture one module
  node scanner.js --crm <name>     --phase 2 --all-modules         Deep-capture all modules from phase 1
  node scanner.js --resume                                          Resume from last checkpoint

Available CRMs: ${Object.keys(CRM_CONFIGS).join(', ')}
Output dir:     scanner/output/<crm-name>/

The scanner auto-pauses when monitor.js signals low Claude usage (.PAUSE file),
and resumes automatically once the reset time is reached.
`);
}
