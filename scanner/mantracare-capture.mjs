/**
 * MantraCare evidence re-capture (see docs/MantraCare/10_Screenshot_Recapture_Checklist.md)
 *
 * Read-only. Never submits a form, books, pays, prescribes or changes an account.
 * Credentials are never handled here: `--auth` opens a real Chrome window and waits
 * for YOU to sign in, then persists the session for the later capture runs.
 *
 *   node mantracare-capture.mjs --assessments    # public, no login
 *   node mantracare-capture.mjs --public-extra   # public, no login
 *   node mantracare-capture.mjs --auth           # you log in; saves .session_mantracare
 *   node mantracare-capture.mjs --provider       # needs the saved session
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline';
import crypto from 'node:crypto';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../docs/MantraCare/screenshots');
const SESSION = path.join(HERE, '.session_mantracare');

const VIEWPORT = { width: 1440, height: 900 };
const SCALE = 2; // existing captures are 2880px wide — keep the convention

const log = (...a) => console.log('·', ...a);
const SEEN = new Map();
const DUPES = [];

async function ctx({ session = false, headless = true } = {}) {
  const browser = await chromium.launch({ channel: 'chrome', headless });
  const opts = { viewport: VIEWPORT, deviceScaleFactor: SCALE };
  if (session) {
    if (!fs.existsSync(SESSION)) {
      console.error('No saved session. Run:  node mantracare-capture.mjs --auth');
      process.exit(1);
    }
    opts.storageState = SESSION;
  }
  return { browser, context: await browser.newContext(opts) };
}

async function save(page, rel, opts = {}) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const { viewportOnly, ...rest } = opts;
  await page.screenshot({ path: file, fullPage: !viewportOnly, ...rest });
  const { size } = fs.statSync(file);
  const sum = crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
  const twin = SEEN.get(sum);
  if (twin && twin !== rel) {
    console.error(`  !! ${rel} is byte-identical to ${twin} — the view did not change; not a distinct shot`);
    DUPES.push([rel, twin]);
  }
  if (!twin) SEEN.set(sum, rel);
  log(`saved ${rel} (${(size / 1024).toFixed(0)} KB)`);
}

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  // let lazy images and webfonts land before the full-page capture
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 700));
    window.scrollTo(0, 0);
    await document.fonts?.ready;
  });
  await page.waitForTimeout(600);
}

/** Swiper lays the Gravity Forms pages out side by side; stack them vertically so a
 *  single full-page capture shows the whole item list. No content is altered. */
const REVEAL_PAGES = () => {
  const form = document.querySelector('form.swiper');
  if (form) {
    form.style.overflow = 'visible';
    form.style.height = 'auto';
    form.classList.remove('swiper-horizontal', 'swiper-autoheight');
  }
  const wrap = document.querySelector('.swiper-wrapper');
  if (wrap) {
    wrap.style.transform = 'none';
    wrap.style.display = 'block';
    wrap.style.height = 'auto';
  }
  document.querySelectorAll('.gform_page').forEach((p) => {
    p.style.display = 'block';
    p.style.width = '100%';
    p.style.height = 'auto';
    p.style.opacity = '1';
    p.style.visibility = 'visible';
    p.style.transform = 'none';
    p.style.marginBottom = '8px';
  });
  // the per-page Next/Previous footers add nothing and triple the page height
  document.querySelectorAll('.gform_page_footer').forEach((f) => (f.style.display = 'none'));
};

/** The five severity-band result blocks ship in the delivered HTML as conditional
 *  fields, hidden with the off-screen `left:-9999px` technique. Revealing one shows
 *  the scoring output verbatim, without submitting anything. Text is never altered. */
const REVEAL_FIELD = (id) => {
  const e = document.getElementById(id);
  if (!e) return null;
  const on = {
    display: 'block', position: 'static', left: 'auto', top: 'auto', right: 'auto',
    visibility: 'visible', opacity: '1', overflow: 'visible', clip: 'auto',
    width: 'auto', height: 'auto', 'max-width': '1100px', margin: '24px 0',
  };
  for (const [k, v] of Object.entries(on)) e.style.setProperty(k, v, 'important');
  const m = e.querySelector('.admin-hidden-markup');
  if (m) m.style.setProperty('display', 'block', 'important');
  return true;
};

const HIDE_FIELD = (id) => {
  const e = document.getElementById(id);
  if (e) e.style.cssText = '';
};

/** Union bounding box of the given elements, in full-page coordinates. */
async function clipOf(page, selectors, pad = 16) {
  const box = await page.evaluate((sels) => {
    const els = sels.map((s) => document.querySelector(s)).filter(Boolean);
    if (!els.length) return null;
    const r = els.map((e) => e.getBoundingClientRect());
    const sx = window.scrollX, sy = window.scrollY;
    return {
      x: Math.min(...r.map((b) => b.left)) + sx,
      y: Math.min(...r.map((b) => b.top)) + sy,
      right: Math.max(...r.map((b) => b.right)) + sx,
      bottom: Math.max(...r.map((b) => b.bottom)) + sy,
    };
  }, selectors);
  if (!box) throw new Error(`no elements matched: ${selectors.join(', ')}`);
  return {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.right - box.x + pad * 2,
    height: box.bottom - box.y + pad * 2,
  };
}

/** Stack already-captured panels into one image, labelled with how they were obtained. */
async function montage(context, files, rel, caption) {
  const imgs = files
    .map((f) => `<img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}">`)
    .join('\n');
  const page = await context.newPage();
  await page.setContent(`<style>
    body{margin:0;padding:28px;background:#fff;font:14px/1.5 -apple-system,Segoe UI,sans-serif;width:1440px;box-sizing:border-box}
    p{margin:0 0 20px;color:#444;border-left:3px solid #c00;padding-left:12px}
    img{display:block;width:100%;margin:0 0 14px;border:1px solid #ddd}
  </style><p>${caption}</p>${imgs}`);
  await page.waitForTimeout(500);
  await save(page, rel);
  await page.close();
}

/* ------------------------------------------------------------------ */

async function assessments() {
  const { browser, context } = await ctx();
  const page = await context.newPage();

  // Finding 2 — the depression screener, 8 items, anhedonia absent
  await page.goto('https://app.mantracare.org/en/therapyapp/depression-check/', { waitUntil: 'domcontentloaded' });
  await settle(page);
  await save(page, '_extra/depression__native-step-view__EXTRA.png');

  await page.evaluate(REVEAL_PAGES);
  await page.waitForTimeout(400);
  const items = await page.evaluate(() =>
    [...document.querySelectorAll('.gform_page .gfield--type-radio .gfield_label')].map((l) =>
      l.innerText.replace(/\s+/g, ' ').trim()
    )
  );
  log(`depression items on page: ${items.length}`);
  items.forEach((t, i) => log(`   ${i + 1}. ${t.slice(0, 70)}`));
  const anhedonia = items.some((t) => /little interest or pleasure/i.test(t));
  log(`PHQ-9 item 1 (anhedonia) present: ${anhedonia}`);
  await save(page, 'assessments/depression__all-8-items__EXTRA.png');

  // The severity bands. Each is revealed on its own, in its native grid position,
  // then captured — so every panel is a real screenshot of MantraCare's own markup.
  const BANDS = [
    ['Perfectly fine', 'field_135_21'],
    ['Mild Depression', 'field_135_22'],
    ['Moderate Depression', 'field_135_23'],
    ['Moderately Severe Depression', 'field_135_25'],
    ['Severe Depression', 'field_135_41'],
  ];
  const panels = [];
  for (const [label, id] of BANDS) {
    await page.evaluate(REVEAL_FIELD, id);
    await page.waitForTimeout(250);
    const box = await clipOf(page, [`#${id}`], 20);
    log(`band "${label}" → ${Math.round(box.width)}x${Math.round(box.height)} at y=${Math.round(box.y)}`);
    const rel = `_extra/band__${label.toLowerCase().replace(/\s+/g, '-')}__EXTRA.png`;
    await save(page, rel, { clip: box });
    panels.push(path.join(OUT, rel));
    await page.evaluate(HIDE_FIELD, id);
  }

  // "Perfectly fine" — the zero band that still tells you to book
  fs.copyFileSync(panels[0], path.join(OUT, 'assessments/depression__every-band-books__EXTRA.png'));
  log('saved assessments/depression__every-band-books__EXTRA.png (copy of the Perfectly fine panel)');

  // stitch the five native panels into one image
  await montage(context, panels, 'assessments/depression__severity-bands__EXTRA.png',
    'MantraCare depression screener — all five severity bands, revealed from the page\'s own hidden conditional fields (no submission). Every band ends in "schedule an appointment with a therapist."');

  // the anxiety screener — GAD-7 verbatim, unattributed
  await page.goto('https://app.mantracare.org/en/therapyapp/anxiety-check/', { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.evaluate(REVEAL_PAGES);
  await page.waitForTimeout(400);
  await save(page, 'assessments/anxiety__gad7-verbatim__EXTRA.png');

  await browser.close();
}

async function publicExtra() {
  const { browser, context } = await ctx();
  const page = await context.newPage();

  // the prose that name-drops HAM-A / BAI / GAD / PSWQ with no attribution
  await page.goto('https://mantracare.org/counseling/anxiety-test/', { waitUntil: 'domcontentloaded' });
  await settle(page);
  const clip = await page.evaluate(() => {
    const RX = /HAM-A|Hamilton Anxiety|Beck Anxiety|\bBAI\b|PSWQ|Penn State Worry|Zung|\bGAD\b/i;
    // smallest blocks that mention an instrument — headings and their paragraphs
    const hits = [...document.querySelectorAll('h1,h2,h3,h4,h5,p,li')].filter((e) => {
      const t = e.innerText || '';
      return RX.test(t) && t.length < 1600;
    });
    if (!hits.length) return null;
    const r = hits.map((e) => e.getBoundingClientRect());
    const sy = window.scrollY;
    const top = Math.min(...r.map((b) => b.top)) + sy;
    const bottom = Math.max(...r.map((b) => b.bottom)) + sy;
    return {
      x: 0,
      y: Math.max(0, top - 80),
      width: Math.min(document.documentElement.clientWidth, 1440),
      height: Math.min(bottom - top + 200, 9000),
      found: hits.length,
      sample: hits.map((e) => e.innerText.replace(/\s+/g, ' ').slice(0, 90)).slice(0, 6),
    };
  });
  if (!clip) {
    console.error('! instrument name-drop prose not found — capturing full page instead');
    await save(page, 'public/content__instrument-namedrop__EXTRA.png');
  } else {
    log(`name-drop passages found: ${clip.found}`);
    clip.sample.forEach((x) => log(`   "${x}"`));
    const { found, sample, ...box } = clip;
    await save(page, 'public/content__instrument-namedrop__EXTRA.png', { clip: box });
  }

  await browser.close();
}

async function auth() {
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE });
  const page = await context.newPage();
  await page.goto('https://provider.mantracare.com/');
  console.log(`
  A Chrome window is open at the MantraCare provider login.
  Sign in there yourself — email, then the OTP from your inbox (or Continue
  with Google). Nothing is typed for you and no credential is read from here.

  This will notice when you are through and save the session by itself.
  Waiting up to 20 minutes. Take your time — the window stays open until you
  are actually on the dashboard.
`);

  const deadline = Date.now() + 20 * 60 * 1000;
  let signedIn = false;
  let lastSeen = '';
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000));
    try {
      // NextAuth only sets a *session-token* cookie once authentication succeeds.
      // csrf-token / callback-url / cf_clearance are all set before login — never trust those.
      const cookies = await context.cookies();
      const session = cookies.find((c) => /next-auth\.session-token/i.test(c.name) && (c.value || '').length > 20);
      const here = page.url();
      if (here !== lastSeen) { lastSeen = here; log(`at ${here}`); }
      if (session) {
        signedIn = true;
        log(`session cookie "${session.name}" present`);
        break;
      }
    } catch { /* page navigating — try again */ }
  }

  if (!signedIn) {
    console.error('! no authenticated session detected; nothing saved. The window stays open.');
    await browser.close();
    process.exit(1);
  }

  // Confirm against a protected route before trusting the state.
  await page.goto('https://provider.mantracare.com/clients', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const bounced = await page
    .evaluate(() => /Enter your email address to continue|Continue with Google/i.test(document.body.innerText))
    .catch(() => true);
  if (bounced) {
    console.error(`! /clients still shows the sign-in screen (at ${page.url()}) — not saving.`);
    await browser.close();
    process.exit(1);
  }
  log(`verified against a protected route: ${page.url()}`);

  await page.waitForTimeout(2500);
  await context.storageState({ path: SESSION });
  log(`session saved to ${path.relative(process.cwd(), SESSION)}`);
  await browser.close();
}

/** Dump every in-app link the signed-in portal exposes, so the capture list is
 *  built from the real routes rather than guessed ones. */
async function discover() {
  const { browser, context } = await ctx({ session: true, headless: false });
  const page = await context.newPage();
  await page.goto('https://provider.mantracare.com/get-started', { waitUntil: 'domcontentloaded' });
  await settle(page);
  const links = await page.evaluate(() =>
    [...new Set(
      [...document.querySelectorAll('a[href]')]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h && !/^(#|mailto:|tel:|javascript:)/.test(h))
        .map((h) => (h.startsWith('http') ? h : h.replace(/^\/?/, '/')))
    )].sort()
  );
  const file = path.join(HERE, 'mantracare-routes.json');
  fs.writeFileSync(file, JSON.stringify({ capturedAt: new Date().toISOString(), url: page.url(), links }, null, 2));
  log(`${links.length} links → ${path.relative(process.cwd(), file)}`);
  links.forEach((l) => console.log('   ' + l));
  await save(page, 'provider/dashboard__home__ss_62924duj1.png');
  await browser.close();
}

/** Visit candidate routes and report what is really there — no images written.
 *  Used to fix the route list and to see how much PII each screen carries. */
const CANDIDATES = [
  '/get-started', '/clients', '/session/notes', '/tools', '/tools/prescription',
  '/tools/ai-transcriber', '/ai-crm', '/custom-forms', '/appointments', '/scheduling',
  '/scheduling/timeslots', '/scheduling/daysoff', '/availability', '/billing',
  '/invoices', '/invoices/create', '/requests', '/premium', '/earnings', '/chat',
  '/refer-earn', '/marketing', '/bank-tax', '/settings', '/profile', '/tasks',
];

async function probe() {
  const { browser, context } = await ctx({ session: true, headless: false });
  const page = await context.newPage();
  const rows = [];
  for (const route of CANDIDATES) {
    const url = `https://provider.mantracare.com${route}`;
    let row = { route, ok: false };
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(3500);
      const info = await page.evaluate(() => {
        const t = document.body.innerText || '';
        return {
          title: document.title,
          h: (document.querySelector('h1,h2')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          notFound: /404|not found|page could not be found/i.test(t),
          login: /Enter your email address to continue/i.test(t),
          emails: (t.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || []).length,
          phones: (t.match(/(\+?\d[\d\s().-]{8,}\d)/g) || []).length,
          chars: t.length,
        };
      });
      row = { route, ok: true, status: resp?.status(), finalUrl: page.url().replace('https://provider.mantracare.com', ''), ...info };
    } catch (e) {
      row.error = e.message.split('\n')[0].slice(0, 70);
    }
    rows.push(row);
    const tag = row.error ? `ERR ${row.error}` :
      `${row.status} ${row.notFound ? 'NOT-FOUND' : row.login ? 'LOGIN' : 'ok'} ` +
      `→${row.finalUrl}  "${row.h}"  pii(email:${row.emails} phone:${row.phones})`;
    console.log(`  ${route.padEnd(24)} ${tag}`);
  }
  fs.writeFileSync(path.join(HERE, 'mantracare-routes.json'), JSON.stringify(rows, null, 2));
  await browser.close();
}

/** Blur any short element whose text carries one of these names. Evidence shots are
 *  of structure and defects, not of people. */
const REDACT = (names) => {
  const rx = new RegExp(names.join('|'), 'i');
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const targets = new Set();
  let n;
  while ((n = walk.nextNode())) {
    if (rx.test(n.nodeValue || '')) {
      const el = n.parentElement;
      if (el && (el.innerText || '').length < 180) targets.add(el);
    }
  }
  targets.forEach((el) => {
    el.style.filter = 'blur(7px)';
    el.setAttribute('data-redacted', 'true');
  });
  return targets.size;
};
const NAMES = ['Aditya', 'aditya test'];

async function redact(page) {
  return page.evaluate(REDACT, NAMES).catch(() => 0);
}

/** ⚠️ PRIORITY 1, finding 1 — the prescribing formulary.
 *  Opens an existing prescription read-only. Never clicks "Submit Prescription". */
async function formulary() {
  const { browser, context } = await ctx({ session: true, headless: false });
  const page = await context.newPage();
  const B = 'https://provider.mantracare.com';

  await page.goto(`${B}/tools/prescription`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await redact(page);
  await save(page, 'provider/prescriptions__screen-1__ss_005701oz7.png');

  await page.getByRole('button', { name: 'View' }).first().click();
  await page.waitForTimeout(5000);
  await redact(page);
  await save(page, 'provider/prescriptions__screen-2__ss_6251fwnct.png');

  // Medicine → Add  (the third bare "Add"; the first two are diagnosis and tests)
  await page.getByRole('button', { name: 'Add', exact: true }).nth(2).click();
  await page.waitForTimeout(3500);
  await redact(page);
  await save(page, 'provider/prescriptions__formulary-picker__ss_4316fhwg5.png', { viewportOnly: true });
  await save(page, '_extra/rx__list-top-scroll__EXTRA.png', { viewportOnly: true });
  await save(page, '_extra/rx__submit-button-context__EXTRA.png');

  const search = page.getByPlaceholder('Search medicines...');

  // Harvest the whole list as text before filtering it — the durable record.
  for (let i = 0; i < 12; i++) {
    const more = page.getByRole('button', { name: 'Load more' });
    if (!(await more.count())) break;
    await more.first().click().catch(() => {});
    await page.waitForTimeout(1200);
  }
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .map((b) => (b.innerText || '').replace(/\s+/g, ' ').trim())
      .filter((t) => /\(\d+\s*(mg|mcg|ml|g)\)/i.test(t))
      .map((t) => {
        const m = t.match(/^(.+?)\s+([A-Z][A-Za-z\s]+?)\s*\((\d+\s*\w+)\)\s*(\w+)?\s*(?:by\s+(.+))?$/);
        return m
          ? { raw: t, brand: m[1].trim(), ingredient: m[2].trim(), strength: m[3].trim(), form: m[4] || '', maker: m[5] || '' }
          : { raw: t };
      })
  );
  const dump = path.resolve(HERE, '../docs/MantraCare/formulary-dump.json');
  fs.writeFileSync(dump, JSON.stringify({ capturedAt: new Date().toISOString(), source: `${B}/tools/prescription → Medicine → Add`, count: rows.length, rows }, null, 2));
  log(`formulary: ${rows.length} rows → ${path.relative(process.cwd(), dump)}`);

  // the reappearing-brand proof, and the diabetes-drug pairings
  await save(page, '_extra/rx__list-mid-scroll__EXTRA.png');

  for (const [term, rel] of [
    ['Cymbalta', '_extra/rx__mispair-cymbalta__EXTRA.png'],
    ['Effexor', '_extra/rx__mispair-effexor__EXTRA.png'],
    ['Wellbutrin', '_extra/rx__mispair-wellbutrin__EXTRA.png'],
    ['Insulin', '_extra/rx__mispair-insulin__EXTRA.png'],
    ['Zoloft', '_extra/rx__same-brand-many-ingredients__EXTRA.png'],
  ]) {
    await search.fill('');
    await page.waitForTimeout(500);
    await search.fill(term);
    await page.waitForTimeout(2000);
    const hits = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .map((b) => (b.innerText || '').replace(/\s+/g, ' ').trim())
        .filter((t) => /\(\d+\s*(mg|mcg|ml|g)\)/i.test(t))
    );
    log(`"${term}" → ${hits.length} rows`);
    hits.slice(0, 8).forEach((h) => log(`     ${h.slice(0, 74)}`));
    await redact(page);
    await save(page, rel, { viewportOnly: true });
  }

  await browser.close();
}

/** The cited shots that need a click rather than a URL: tabs, modals, wizards.
 *  Forms are opened to reveal their fields and then dismissed — never submitted. */
async function interactive() {
  const { browser, context } = await ctx({ session: true, headless: false });
  const page = await context.newPage();
  const B = 'https://provider.mantracare.com';
  const done = [], failed = [];

  const step = async (label, fn) => {
    try { await fn(); done.push(label); }
    catch (e) { failed.push([label, e.message.split('\n')[0].slice(0, 90)]); console.error(`  ! ${label}: ${e.message.split('\n')[0].slice(0, 90)}`); }
  };
  const go = async (route) => { await page.goto(B + route, { waitUntil: 'domcontentloaded' }); await settle(page); };
  const tab = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(3000); };
  const shot = async (rel, opts) => { await redact(page); await save(page, rel, opts); };
  const scrollShot = async (rel, y) => {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(900);
    await redact(page);
    await save(page, rel, { viewportOnly: true });
  };

  // ---- Settings tabs
  await step('settings/practice', async () => { await go('/settings'); await tab('Practice Details'); await shot('provider/settings__practice__ss_5614cd3dg.png'); });
  await step('settings/service-taxonomy', async () => { await scrollShot('_extra/service-taxonomy__EXTRA.png', 1400); });
  await step('settings/team', async () => { await tab('Team/ Providers'); await shot('provider/settings__team__ss_9198b781s.png'); });
  await step('settings/notifications', async () => { await tab('Notifications'); await shot('provider/settings__notifications__ss_1749aweo6.png'); });
  await step('settings/subscription', async () => {
    await tab('Subscription');
    await shot('provider/settings__subscription-1__ss_5551vq4xv.png');
    await scrollShot('provider/settings__subscription-2__ss_5932h9j12.png', 700);
    await scrollShot('provider/settings__subscription-3__ss_84147ubmo.png', 1500);
    await scrollShot('provider/settings__subscription-4__ss_4714fevoq.png', 2300);
  });

  // ---- Resources catalog (a sidebar button, not a route)
  await step('resources/catalog', async () => {
    await go('/get-started');
    await page.getByRole('button', { name: 'Resources', exact: true }).first().click();
    await page.waitForTimeout(4500);
    await settle(page);
    await shot('provider/resources__catalog-1__ss_0479w1zro.png');
    await scrollShot('provider/resources__catalog-2__ss_7529oo2l4.png', 900);
    await scrollShot('provider/resources__catalog-3__ss_826318mhj.png', 1900);
  });

  // ---- Dashboard variant: Action Center opened
  await step('dashboard/alt', async () => {
    await go('/get-started');
    await page.getByText('Action Center', { exact: false }).first().click();
    await page.waitForTimeout(2500);
    await shot('provider/dashboard__alt__ss_8819tl7wu.png');
  });

  // ---- Clients: list, add-client modal, the client chart
  await step('clients/list-2', async () => { await go('/clients'); await scrollShot('provider/clients__list-2__ss_4691tnjie.png', 500); });
  await step('clients/add-modal', async () => {
    await go('/clients');
    const add = page.getByRole('button', { name: /add.*client|new client/i }).first();
    await add.click();
    await page.waitForTimeout(3000);
    await shot('provider/clients__add-modal-1__ss_7610g8s9f.png', { viewportOnly: true });
    await scrollShot('provider/clients__add-modal-2__ss_2529q65q8.png', 400);
    await scrollShot('provider/clients__add-modal-3__ss_7051i3mjf.png', 900);
    await page.keyboard.press('Escape').catch(() => {});
  });
  await step('clients/record-13tab', async () => {
    await go('/clients');
    await page.locator('table tbody tr, [role=row]').first().click({ timeout: 8000 });
    await page.waitForTimeout(5000);
    await shot('provider/clients__record-13tab__ss_6691gvev7.png');
  });

  // ---- Session notes
  await step('notes/add-wizard', async () => {
    await go('/session/notes');
    await page.getByRole('button', { name: /add|new/i }).first().click();
    await page.waitForTimeout(3500);
    await shot('provider/notes__add-wizard__ss_7174hz6i8.png', { viewportOnly: true });
    await scrollShot('provider/notes__editor-1__ss_8379pptyy.png', 500);
    await scrollShot('provider/notes__editor-2__ss_1652tjxyf.png', 1100);
    await scrollShot('provider/notes__editor-5__ss_0135cjoov.png', 1800);
  });

  // ---- Appointments wizard
  await step('appointments/add', async () => {
    await go('/appointments');
    await page.getByRole('button', { name: /add|new|book/i }).first().click();
    await page.waitForTimeout(3500);
    await shot('provider/appointments__add-1__ss_34846ve4t.png', { viewportOnly: true });
    await scrollShot('provider/appointments__add-2__ss_0209nk2wk.png', 500);
    await page.keyboard.press('Escape').catch(() => {});
  });

  // ---- Premium score gate, invoice linkage, form preview
  await step('premium/score-gate', async () => { await go('/premium'); await scrollShot('provider/premium__preferred-2__ss_2115au8kb.png', 1200); });
  await step('invoice/create-2', async () => { await go('/invoices/create'); await scrollShot('provider/invoice__create-2__ss_8937zzwoq.png', 700); });
  await step('forms/preview', async () => {
    await go('/custom-forms');
    await page.getByRole('button', { name: /preview|view/i }).first().click({ timeout: 8000 });
    await page.waitForTimeout(3500);
    await shot('provider/forms__preview__ss_093481hlx.png');
  });

  console.log(`\n  captured: ${done.length}   failed: ${failed.length}`);
  failed.forEach(([l, m]) => console.log(`   ! ${l} — ${m}`));
  await browser.close();
}

/** Second pass: the views the first interactive run captured as duplicates,
 *  which turned out to be tabbed rather than scrolling. */
async function fixups() {
  const { browser, context } = await ctx({ session: true, headless: false });
  const page = await context.newPage();
  const B = 'https://provider.mantracare.com';
  const failed = [];
  const step = async (label, fn) => {
    try { await fn(); } catch (e) { failed.push([label, e.message.split('\n')[0].slice(0, 90)]); console.error(`  ! ${label}: ${e.message.split('\n')[0].slice(0, 90)}`); }
  };
  const go = async (r) => { await page.goto(B + r, { waitUntil: 'domcontentloaded' }); await settle(page); };
  const click = async (name) => {
    const el = page.getByRole('button', { name, exact: false }).first();
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await el.click({ force: true, timeout: 15000 });
    await page.waitForTimeout(3500);
  };
  const shot = async (rel, opts) => { await redact(page); await save(page, rel, opts); };

  // Resources catalog — sidebar button, needed a forced click
  await step('resources', async () => {
    await go('/get-started');
    await click('Resources');
    await settle(page);
    await shot('provider/resources__catalog-1__ss_0479w1zro.png');
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    log(`resources page scrollable by ${max}px`);
    for (const [rel, frac] of [['provider/resources__catalog-2__ss_7529oo2l4.png', 0.45], ['provider/resources__catalog-3__ss_826318mhj.png', 0.9]]) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(max * frac));
      await page.waitForTimeout(1200);
      await shot(rel, { viewportOnly: true });
    }
  });

  // Session notes: the list lives at /session/all; /session/notes is the note surface
  await step('notes/list', async () => { await go('/session/all'); await shot('provider/notes__list__ss_4107by1qp.png'); });
  await step('notes/editors', async () => {
    await go('/session/notes');
    await shot('provider/notes__add-wizard__ss_7174hz6i8.png');
    await step('notes/add-another', async () => { await click('Add Another Note'); await shot('provider/notes__editor-1__ss_8379pptyy.png'); });
    await step('notes/transcripts', async () => { await click('Transcripts'); await shot('provider/notes__editor-2__ss_1652tjxyf.png'); });
    await step('notes/add-notes', async () => { await click('Add Notes'); await shot('provider/notes__editor-5__ss_0135cjoov.png'); });
  });

  // Appointments: Add opens a chooser; pick the booking branch for step 2, never confirm
  await step('appointments/add', async () => {
    await go('/appointments');
    await click('Add');
    await shot('provider/appointments__add-1__ss_34846ve4t.png', { viewportOnly: true });
    await page.getByText(/Book a future session/i).first().click({ force: true, timeout: 12000 });
    await page.waitForTimeout(3500);
    await shot('provider/appointments__add-2__ss_0209nk2wk.png', { viewportOnly: true });
    await page.keyboard.press('Escape').catch(() => {});
  });

  // Subscription is tabbed: Overview / Payments / Manage Credit Usage
  await step('subscription', async () => {
    await go('/settings');
    await click('Subscription');
    await shot('provider/settings__subscription-1__ss_5551vq4xv.png');
    await step('sub/payments', async () => { await click('Payments'); await shot('provider/settings__subscription-2__ss_5932h9j12.png'); });
    await step('sub/credit', async () => { await click('Manage Credit Usage'); await shot('provider/settings__subscription-3__ss_84147ubmo.png'); });
    await step('sub/caps', async () => {
      const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      await page.evaluate((y) => window.scrollTo(0, y), max);
      await page.waitForTimeout(1200);
      await shot('provider/settings__subscription-4__ss_4714fevoq.png', { viewportOnly: true });
    });
  });

  if (DUPES.length) { console.error('\n  duplicates still present:'); DUPES.forEach(([a, b]) => console.error(`   ${a} == ${b}`)); }
  if (failed.length) { console.error('\n  failed:'); failed.forEach(([l, m]) => console.error(`   ${l} — ${m}`)); }
  await browser.close();
}

/* Priority 2 — URL-addressable provider screens. Interaction-driven shots
 * (modals, the medicine picker) are handled separately once signed in. */
const PROVIDER_SCREENS = [
  ['provider/dashboard__home__ss_62924duj1.png', '/get-started'],
  ['provider/clients__list__ss_0378c3i4v.png', '/clients'],
  ['provider/notes__list__ss_4107by1qp.png', '/session/notes'],
  ['provider/notes__editor-3__ss_5049qxpm4.png', '/tools/session-notes'],
  ['provider/notes__editor-4__ss_0983h5c2z.png', '/session/notes/view'],
  ['provider/ai-transcriber__ss_71281wk9q.png', '/tools/ai-transcriber'],
  ['provider/ai-crm__mantraassist__ss_1580l635c.png', '/ai-crm'],
  ['provider/forms__list__ss_75686oskf.png', '/custom-forms'],
  ['provider/appointments__list__ss_0777ququo.png', '/appointments'],
  ['provider/availability__1__ss_94277qsmz.png', '/scheduling/calendar'],
  ['provider/availability__2__ss_7667fngvf.png', '/scheduling/timeslots'],
  ['provider/availability__3__ss_0882usf05.png', '/scheduling/daysoff'],
  ['provider/billing__hub-1__ss_464949uq8.png', '/billing'],
  ['provider/billing__hub-2__ss_1116zyhr3.png', '/invoices/unbilled'],
  ['provider/invoice__create-1__ss_9651ivljv.png', '/invoices/create'],
  ['provider/prescriptions__screen-3__ss_483158fwu.png', '/prescriptions'],
  ['provider/leads__client-leads__ss_8391n7cy7.png', '/requests'],
  ['provider/premium__preferred-1__ss_4031whj60.png', '/premium'],
  ['provider/tasks__ss_3331g6bq8.png', '/tasks'],
  ['provider/earnings__ss_0066i24h5.png', '/earnings'],
  ['provider/messages__ss_9513itupa.png', '/chat'],
  ['provider/refer-earn__ss_47123uh6x.png', '/refer-earn'],
  ['provider/settings__practice__ss_5614cd3dg.png', '/settings'],
  ['provider/ehr__credentialing__EXTRA.png', '/ehr/credentialing'],
  ['_extra/marketing__EXTRA.png', '/marketing'],
  ['_extra/bank-tax__EXTRA.png', '/bank-tax'],
  ['_extra/treatment-plans__EXTRA.png', '/treatment-plans'],
  ['_extra/wallet__EXTRA.png', '/wallet'],
  ['_extra/community__EXTRA.png', '/community'],
];

async function provider() {
  const { browser, context } = await ctx({ session: true, headless: false });
  const page = await context.newPage();
  const failed = [];
  for (const [rel, route] of PROVIDER_SCREENS) {
    const url = `https://provider.mantracare.com${route}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await settle(page);
      if (/login|get-started\?|signin/i.test(page.url()) && route !== '/get-started') {
        failed.push([rel, `redirected to ${page.url()} — session may have expired`]);
        continue;
      }
      await redact(page);
      await save(page, rel);
    } catch (e) {
      failed.push([rel, e.message.split('\n')[0]]);
    }
  }
  if (failed.length) {
    console.error('\n! not captured:');
    failed.forEach(([r, m]) => console.error(`  ${r} — ${m}`));
  }
  await browser.close();
}

/** Third pass. /session/notes only holds if you click through from /session/all —
 *  a direct visit redirects. And "Manage Credit Usage" is a section, not a tab. */
async function fixups2() {
  const { browser, context } = await ctx({ session: true, headless: false });
  const page = await context.newPage();
  const B = 'https://provider.mantracare.com';
  const failed = [];
  const step = async (l, fn) => { try { await fn(); } catch (e) { failed.push([l, e.message.split('\n')[0].slice(0, 90)]); console.error(`  ! ${l}: ${e.message.split('\n')[0].slice(0, 90)}`); } };
  const click = async (name) => {
    const el = page.getByRole('button', { name, exact: false }).first();
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await el.click({ force: true, timeout: 15000 });
    await page.waitForTimeout(3500);
  };
  const shot = async (rel, opts) => { await redact(page); await save(page, rel, opts); };

  await step('notes', async () => {
    await page.goto(`${B}/session/all`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await click('Session Notes');
    log(`after click-through: ${page.url()}`);
    await settle(page);
    await shot('provider/notes__add-wizard__ss_7174hz6i8.png');
    await step('notes/editor-1', async () => { await click('Add Another Note'); await shot('provider/notes__editor-1__ss_8379pptyy.png'); });
    await step('notes/editor-2', async () => { await click('Transcripts'); await shot('provider/notes__editor-2__ss_1652tjxyf.png'); });
    await step('notes/editor-5', async () => { await click('Add Notes'); await shot('provider/notes__editor-5__ss_0135cjoov.png'); });
  });

  await step('subscription-3', async () => {
    await page.goto(`${B}/settings`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await click('Subscription');
    const box = await clipOf(page, ['text=Credit usage breakdown'], 20).catch(async () => {
      const y = await page.evaluate(() => {
        const el = [...document.querySelectorAll('*')].find((e) => /Credit usage breakdown/i.test(e.textContent || '') && e.children.length < 6);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: 0, y: Math.max(0, r.top + scrollY - 40), width: Math.min(document.documentElement.clientWidth, 1440), height: Math.min(r.height + 700, 2400) };
      });
      if (!y) throw new Error('credit-usage section not found');
      return y;
    });
    await shot('provider/settings__subscription-3__ss_84147ubmo.png', { clip: box });
  });

  if (DUPES.length) { console.error('\n  duplicates:'); DUPES.forEach(([a, b]) => console.error(`   ${a} == ${b}`)); }
  if (failed.length) { console.error('\n  failed:'); failed.forEach(([l, m]) => console.error(`   ${l} — ${m}`)); }
  await browser.close();
}

/** The notes editor is only reachable by clicking the "Click to manage session"
 *  card on /session/all — a direct visit to /session/notes redirects away. */
async function fixups3() {
  const { browser, context } = await ctx({ session: true, headless: false });
  const page = await context.newPage();
  const failed = [];
  const step = async (l, fn) => { try { await fn(); } catch (e) { failed.push([l, e.message.split('\n')[0].slice(0, 80)]); console.error(`  ! ${l}: ${e.message.split('\n')[0].slice(0, 80)}`); } };
  const click = async (name) => {
    const el = page.getByRole('button', { name, exact: false }).first();
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await el.click({ force: true, timeout: 15000 });
    await page.waitForTimeout(3500);
  };
  const shot = async (rel, opts) => { await redact(page); await save(page, rel, opts); };

  await page.goto('https://provider.mantracare.com/session/all', { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.getByText('Click to manage session').first().click({ force: true });
  await page.waitForTimeout(5000);
  await settle(page);
  log(`notes surface: ${page.url()}`);
  await shot('provider/notes__editor-5__ss_0135cjoov.png');

  await step('transcripts', async () => { await click('Transcripts'); await shot('provider/notes__editor-2__ss_1652tjxyf.png'); });
  await step('session-notes-tab', async () => { await click('Session Notes ('); await shot('provider/notes__editor-1__ss_8379pptyy.png'); });
  await step('template-chooser', async () => { await click('Add Notes'); await shot('provider/notes__add-wizard__ss_7174hz6i8.png'); });

  if (DUPES.length) { console.error('\n  duplicates:'); DUPES.forEach(([a, b]) => console.error(`   ${a} == ${b}`)); }
  if (failed.length) { console.error('\n  failed:'); failed.forEach(([l, m]) => console.error(`   ${l} — ${m}`)); }
  await browser.close();
}

/** Fourth pass: the six collisions the duplicate scan found. */
async function fixups4() {
  const { browser, context } = await ctx({ session: true, headless: false });
  const page = await context.newPage();
  const B = 'https://provider.mantracare.com';
  const failed = [];
  const step = async (l, fn) => { try { await fn(); } catch (e) { failed.push([l, e.message.split('\n')[0].slice(0, 80)]); console.error(`  ! ${l}: ${e.message.split('\n')[0].slice(0, 80)}`); } };
  const shot = async (rel, opts) => { await redact(page); await save(page, rel, opts); };
  const clipAround = async (rx, extra = 700) =>
    page.evaluate(({ rxs, extra }) => {
      const re = new RegExp(rxs, 'i');
      const el = [...document.querySelectorAll('*')].find((e) => re.test(e.textContent || '') && e.children.length < 8);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: 0, y: Math.max(0, r.top + scrollY - 40), width: Math.min(document.documentElement.clientWidth, 1440), height: Math.min(r.height + extra, 2400) };
    }, { rxs: rx, extra });

  // Resources opens in a new tab rather than navigating
  await step('resources', async () => {
    await page.goto(`${B}/get-started`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const [popup] = await Promise.all([
      context.waitForEvent('page', { timeout: 20000 }).catch(() => null),
      page.getByRole('button', { name: 'Resources', exact: true }).first().click({ force: true }),
    ]);
    const target = popup || page;
    await target.waitForLoadState('domcontentloaded').catch(() => {});
    await target.waitForTimeout(6000);
    await settle(target);
    log(`resources surface: ${target.url()}`);
    if (target.url().replace(/\/$/, '') === `${B}` ) throw new Error('Resources did not open a distinct surface');
    await target.evaluate(REDACT, NAMES).catch(() => {});
    await save(target, 'provider/resources__catalog-1__ss_0479w1zro.png');
    const max = await target.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    log(`  scrollable by ${max}px`);
    for (const [rel, f] of [['provider/resources__catalog-2__ss_7529oo2l4.png', 0.4], ['provider/resources__catalog-3__ss_826318mhj.png', 0.85]]) {
      await target.evaluate((y) => window.scrollTo(0, y), Math.round(max * f));
      await target.waitForTimeout(1200);
      await save(target, rel, { viewportOnly: true });
    }
    if (popup) await popup.close();
  });

  // Invoice creation is behind "Create Bill" on /billing
  await step('invoice/create', async () => {
    await page.goto(`${B}/billing`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.getByRole('button', { name: /create bill/i }).first().click({ force: true, timeout: 15000 });
    await page.waitForTimeout(4500);
    await settle(page);
    log(`invoice surface: ${page.url()}`);
    await shot('provider/invoice__create-1__ss_9651ivljv.png');
    const box = await clipAround('session|unbilled|line item|amount', 900);
    await shot('provider/invoice__create-2__ss_8937zzwoq.png', box ? { clip: box } : { viewportOnly: true });
  });

  // Credit-usage caps as their own frame
  await step('subscription-3', async () => {
    await page.goto(`${B}/settings`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.getByRole('button', { name: 'Subscription' }).first().click({ force: true });
    await page.waitForTimeout(4000);
    const box = await clipAround('Credit usage breakdown', 900);
    if (!box) throw new Error('credit usage section not found');
    await shot('provider/settings__subscription-3__ss_84147ubmo.png', { clip: box });
  });

  // The 4 correct rows at the top of the formulary, as their own frame
  await step('rx/list-top', async () => {
    await page.goto(`${B}/tools/prescription`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.getByRole('button', { name: 'View' }).first().click();
    await page.waitForTimeout(5000);
    await page.getByRole('button', { name: 'Add', exact: true }).nth(2).click();
    await page.waitForTimeout(3500);
    const box = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('button')].filter((b) => /\(\d+\s*mg\)/i.test(b.innerText || '')).slice(0, 4);
      if (rows.length < 4) return null;
      const r = rows.map((e) => e.getBoundingClientRect());
      return { x: Math.min(...r.map((b) => b.left)) - 12 + scrollX, y: Math.min(...r.map((b) => b.top)) - 70 + scrollY,
               width: Math.max(...r.map((b) => b.width)) + 24, height: Math.max(...r.map((b) => b.bottom)) - Math.min(...r.map((b) => b.top)) + 90 };
    });
    if (!box) throw new Error('could not locate the first four rows');
    await shot('_extra/rx__list-top-scroll__EXTRA.png', { clip: box });
  });

  // Service taxonomy — try the provider profile
  await step('service-taxonomy', async () => {
    await page.goto(`${B}/profile`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const box = await clipAround('service|specialit|specialt|therapist intern|AI Therapist', 1100);
    if (!box) throw new Error('no service-type list found on /profile');
    await shot('_extra/service-taxonomy__EXTRA.png', { clip: box });
  });

  if (DUPES.length) { console.error('\n  duplicates:'); DUPES.forEach(([a, b]) => console.error(`   ${a} == ${b}`)); }
  if (failed.length) { console.error('\n  failed:'); failed.forEach(([l, m]) => console.error(`   ${l} — ${m}`)); }
  await browser.close();
}

const arg = process.argv[2];
const modes = { '--assessments': assessments, '--public-extra': publicExtra, '--auth': auth, '--discover': discover, '--probe': probe, '--formulary': formulary, '--interactive': interactive, '--fixups': fixups, '--fixups2': fixups2, '--fixups3': fixups3, '--fixups4': fixups4, '--provider': provider };
if (!modes[arg]) {
  console.error(`usage: node mantracare-capture.mjs [${Object.keys(modes).join(' | ')}]`);
  process.exit(1);
}
await modes[arg]();
