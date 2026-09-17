// Dev-only probe: screenshot one route with step timing. Usage:
//   node scripts/probe.mjs <path> <role|-> <width>
import { chromium } from 'playwright-core';
const [, , routePath = '/', role = '-', widthArg = '360'] = process.argv;
const width = Number(widthArg);
const base = process.env.BASE_URL ?? 'http://localhost:3999';
const t = Date.now();
const log = (m) => console.log(((Date.now() - t) / 1000).toFixed(1) + 's', m);
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--disable-background-networking', '--no-sandbox'],
});
log('launched');
const ctx = await browser.newContext({ viewport: { width, height: 780 } });
if (role !== '-') await ctx.addCookies([{ name: 'saday_dev_role', value: role, url: base }]);
const page = await ctx.newPage();
page.on('pageerror', (e) => log('pageerror: ' + e.message.slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error') log('console: ' + m.text().slice(0, 160)); });
await page.goto(base + routePath, { waitUntil: 'load', timeout: 20000 });
log('loaded');
const slug = routePath === '/' ? 'home' : routePath.replace(/^\//, '').replace(/[/?=&]/g, '-');
await page
  .screenshot({ path: `/home/claude/saday-crm/_screens/${slug}-${width}.png`, fullPage: true, timeout: 15000 })
  .then(() => log('shot ok'))
  .catch((e) => log('shot fail ' + e.message.slice(0, 120)));
await browser.close();
log('done');
