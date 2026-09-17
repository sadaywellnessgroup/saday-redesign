#!/usr/bin/env node
/* Starts the built app (`next start`) on a free port, screenshots every
 * route in ROUTES at 360x780 and 1280x800 (D-033: mobile-first, verified
 * at both sizes) into /home/claude/saday-crm/_screens/<route>-<w>.png,
 * then exits. Uses the pre-installed Chromium under /opt/pw-browsers —
 * never runs `playwright install`. */

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { mkdir as mkdirP } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_ROOT, '..');
const OUT_DIR = path.join(REPO_ROOT, '_screens');

/* Dynamic segments use fixed fixture ids so every screenshot is
 * reproducible (mirrors `getSession()`'s "always the same patient/provider
 * id" note in app/README.md): provider slug/id = Dr. Aditya Agrawal
 * (psychiatrist, NMC-registered, has both languages and upcoming slots),
 * appointment = appt_4 (pat_1's upcoming scheduled session with Janhavi),
 * thread = thread_1 (pat_1 <-> Janhavi), assessment tool = PHQ-9.
 *
 * Provider console (role `provider` = prov_aditya): patient = pat_2
 * (Rohan Mehta, signed proforma_1 + signed note_8), pat_3 (draft
 * proforma_2), pat_4 (draft note_draft_1). `/pro/patients/[id]/notes/new`
 * and `/proforma/new` are creating routes — they redirect, so the
 * screenshot list points at the ids they create instead. */
const ROUTES = [
  { path: '/', role: null },
  { path: '/login', role: null },
  { path: '/intake', role: null },
  { path: '/providers', role: null },
  { path: '/providers/aditya', role: null },
  { path: '/book/prov_aditya', role: null },
  { path: '/book/earliest', role: null },
  { path: '/booking/appt_4/confirmed', role: null },
  { path: '/app', role: 'patient' },
  { path: '/app/sessions', role: 'patient' },
  { path: '/app/track', role: 'patient' },
  { path: '/app/track/assess/tool_phq9_en', role: 'patient' },
  { path: '/app/files', role: 'patient' },
  { path: '/app/messages', role: 'patient' },
  { path: '/app/messages/thread_1', role: 'patient' },
  { path: '/app/profile', role: 'patient' },
  { path: '/pro', role: 'provider' },
  { path: '/pro/calendar', role: 'provider' },
  { path: '/pro/availability', role: 'provider' },
  { path: '/pro/patients', role: 'provider' },
  { path: '/pro/patients/pat_2', role: 'provider' },
  { path: '/pro/patients/pat_2?tab=notes', role: 'provider' },
  { path: '/pro/patients/pat_2?tab=proforma', role: 'provider' },
  { path: '/pro/patients/pat_2?tab=assessments', role: 'provider' },
  { path: '/pro/patients/pat_2?tab=files', role: 'provider' },
  { path: '/pro/patients/pat_2?tab=messages', role: 'provider' },
  { path: '/pro/patients/pat_4/notes/note_draft_1', role: 'provider' },
  { path: '/pro/patients/pat_2/notes/note_8', role: 'provider' },
  { path: '/pro/patients/pat_2/notes/new', role: 'provider' },
  { path: '/pro/patients/pat_3/proforma/proforma_2', role: 'provider' },
  { path: '/pro/patients/pat_2/proforma/proforma_1', role: 'provider' },
  { path: '/pro/earnings', role: 'provider' },
  { path: '/pro/more', role: 'provider' },
  { path: '/pro/more/materials', role: 'provider' },
  { path: '/pro/more/profile', role: 'provider' },
  { path: '/pro/more/notifications', role: 'provider' },
  { path: '/admin', role: 'admin' },
  { path: '/admin/providers', role: 'admin' },
  { path: '/admin/providers/prov_aditya', role: 'admin' },
  { path: '/admin/clients', role: 'admin' },
  { path: '/admin/clients/pat_2', role: 'admin' },
  { path: '/admin/payments', role: 'admin' },
  { path: '/admin/payments?tab=refunds', role: 'admin' },
  { path: '/admin/payments?tab=payouts', role: 'admin' },
  { path: '/admin/follow-ups', role: 'admin' },
  { path: '/admin/follow-ups?tab=submissions', role: 'admin' },
  { path: '/admin/settings', role: 'admin' },
];

const SIZES = [
  { width: 360, height: 780 },
  { width: 1280, height: 800 },
];

const CHROMIUM_CANDIDATES = [
  '/opt/pw-browsers/chromium/chrome',
  '/opt/pw-browsers/chromium',
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
];

function findChromiumExecutable() {
  for (const candidate of CHROMIUM_CANDIDATES) {
    try {
      if (existsSync(candidate)) return candidate;
    } catch {
      /* keep looking */
    }
  }
  throw new Error(`No chromium executable found in: ${CHROMIUM_CANDIDATES.join(', ')}`);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.status < 500) return resolve();
      } catch {
        /* not up yet */
      }
      if (Date.now() > deadline) return reject(new Error(`Server did not come up at ${url} in time`));
      setTimeout(tick, 400);
    };
    tick();
  });
}

async function main() {
  await mkdirP(OUT_DIR, { recursive: true });

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const server = spawn('npx', ['next', 'start', '-p', String(port)], {
    cwd: APP_ROOT,
    stdio: 'inherit',
    env: { ...process.env, DATA_SOURCE: 'mock', ADAPTER_MODE: 'stub' },
  });

  const cleanup = () => {
    if (!server.killed) server.kill('SIGTERM');
  };
  process.on('exit', cleanup);

  try {
    await waitForServer(baseUrl);

    const executablePath = findChromiumExecutable();
    const browser = await chromium.launch({
      executablePath,
      timeout: 30_000,
      args: [
        '--disable-background-networking',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-sync',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-features=Translate,OptimizationHints,MediaRouter,InterestFeedContentSuggestions',
      ],
    });

    // SCREENS_ONLY="/app/messages,/pro" limits the run to those paths.
    const only = process.env.SCREENS_ONLY?.split(',').map((s) => s.trim()).filter(Boolean);
    const routes = only?.length ? ROUTES.filter((r) => only.includes(r.path)) : ROUTES;
    for (const route of routes) {
      for (const size of SIZES) {
        const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
        if (route.role) {
          await context.addCookies([
            {
              name: 'saday_dev_role',
              value: route.role,
              url: baseUrl,
            },
          ]);
        }
        const page = await context.newPage();
        // 'networkidle' is unreliable with Next.js Link prefetching (it can
        // keep a connection open well past the point the page is actually
        // ready) and has hung indefinitely here; 'load' + waiting for the
        // page heading to paint is both faster and more reliable.
        await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'load', timeout: 30_000 });
        await page.locator('h1, h2, main').first().waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
        await page.waitForTimeout(150); // let webfonts/paints settle
        const slug =
          route.path === '/' ? 'home' : route.path.replace(/^\//, '').replace(/[/?=&]/g, '-');
        const outPath = path.join(OUT_DIR, `${slug}-${size.width}.png`);
        await page.screenshot({ path: outPath, fullPage: true });
        console.log(`saved ${outPath}`);
        await context.close();
      }
    }

    await browser.close();
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
