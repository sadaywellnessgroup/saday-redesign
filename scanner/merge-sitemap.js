/**
 * Merges the Chrome-agent sitemap CSV into phase1_sitemap.json,
 * adding all missing sub-pages with best-guess URLs derived from
 * the URL patterns already discovered by the Playwright scan.
 *
 * Run once: node merge-sitemap.js
 * Then:     node scanner.js --phase 2 --all-modules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const REPORTS    = path.join(__dirname, 'output', 'reports');
const SITEMAP_F  = path.join(REPORTS, 'phase1_sitemap.json');
const BASE       = 'https://app.tealfeed.com';

// ─── All screens from docs/sitemap_phase1.csv with best-guess URLs ───────────
// URL patterns derived from confirmed Playwright discoveries:
//   /connect/sessions/upcoming  →  sessions use /connect/sessions/<tab>
//   /bundles/ongoing            →  bundles use /bundles/<tab>
//   /events/manage/upcoming     →  events use /events/manage/<tab>
//   /payments/earnings/...      →  payments use /payments/<section>
//   /availability/general       →  availability uses /availability/<section>
//   /myblogs/published          →  blogs use /myblogs/<tab>
// Admin Panel URLs are educated guesses — scanner skips 404s gracefully.

const ALL_SCREENS = [
  // ── Home ──────────────────────────────────────────────────────────────────
  { module: 'Home', submenu: '—', screen: 'Dashboard / Overview',
    url: `${BASE}/`, purpose: 'KPI summary: sessions booked, one-off sessions, bundles sold, group sessions; upcoming session card; reschedule requests' },

  // ── Calendar ──────────────────────────────────────────────────────────────
  { module: 'Calendar', submenu: '—', screen: 'Calendar Day/Week view',
    url: `${BASE}/calendar`, purpose: 'Time-grid view of scheduled sessions; drag-to-create; per-member or all-team view' },

  // ── 1-1 Connect ───────────────────────────────────────────────────────────
  { module: '1-1 Connect', submenu: 'My sessions', screen: 'All Sessions — Upcoming',
    url: `${BASE}/connect/sessions/upcoming`, purpose: 'View & manage booked 1-1 sessions — upcoming tab' },
  { module: '1-1 Connect', submenu: 'My sessions', screen: 'All Sessions — Reschedule Requests',
    url: `${BASE}/connect/sessions/reschedule-requests`, purpose: 'View & manage booked 1-1 sessions — reschedule tab' },
  { module: '1-1 Connect', submenu: 'My sessions', screen: 'All Sessions — Past',
    url: `${BASE}/connect/sessions/past`, purpose: 'View & manage booked 1-1 sessions — past tab' },
  { module: '1-1 Connect', submenu: 'Manage sessions', screen: 'Session product list',
    url: `${BASE}/connect/manage`, purpose: 'Create/edit/toggle active the 1-1 service offerings' },

  // ── Bundles ───────────────────────────────────────────────────────────────
  { module: 'Bundles', submenu: 'My Bundles', screen: 'Bundle bookings — Ongoing',
    url: `${BASE}/bundles/ongoing`, purpose: 'Track purchased bundles — ongoing tab' },
  { module: 'Bundles', submenu: 'My Bundles', screen: 'Bundle bookings — Completed',
    url: `${BASE}/bundles/completed`, purpose: 'Track purchased bundles — completed tab' },
  { module: 'Bundles', submenu: 'Manage Bundles', screen: 'Bundle product list',
    url: `${BASE}/bundles/manage`, purpose: 'Create/edit/toggle active bundle products' },

  // ── Events ────────────────────────────────────────────────────────────────
  { module: 'Events', submenu: '—', screen: 'All Events — Upcoming',
    url: `${BASE}/events/manage/upcoming`, purpose: 'Create/manage group event sessions — upcoming' },
  { module: 'Events', submenu: '—', screen: 'All Events — Completed',
    url: `${BASE}/events/manage/completed`, purpose: 'Create/manage group event sessions — completed' },
  { module: 'Events', submenu: '—', screen: 'All Events — Draft',
    url: `${BASE}/events/manage/draft`, purpose: 'Create/manage group event sessions — drafts' },
  { module: 'Events', submenu: '—', screen: 'All Events — Deleted',
    url: `${BASE}/events/manage/deleted`, purpose: 'Create/manage group event sessions — deleted' },
  { module: 'Events', submenu: '—', screen: 'All Events — Unconfirmed',
    url: `${BASE}/events/manage/unconfirmed`, purpose: 'Create/manage group event sessions — unconfirmed' },

  // ── Clients ───────────────────────────────────────────────────────────────
  { module: 'Clients', submenu: '—', screen: 'Client Panel',
    url: `${BASE}/clients/active?page=1`, purpose: 'Client roster with total clients & revenue stats' },

  // ── Availability ──────────────────────────────────────────────────────────
  { module: 'Availability', submenu: 'General Settings', screen: 'Availability — General',
    url: `${BASE}/availability/general`, purpose: 'Global availability toggle, timezone, future booking window, minimum notice' },
  { module: 'Availability', submenu: 'Custom Schedules', screen: 'Availability — Schedule',
    url: `${BASE}/availability/schedules`, purpose: 'Named schedule profiles; per-day time windows with day limits' },

  // ── Payments ──────────────────────────────────────────────────────────────
  { module: 'Payments', submenu: 'Earnings', screen: 'Your Earnings',
    url: `${BASE}/payments/earnings/all-booking?page=1`, purpose: 'Summary of available balance, withdrawn, total; tabs by product type' },
  { module: 'Payments', submenu: 'Withdrawals', screen: 'Withdrawals history',
    url: `${BASE}/payments/withdrawls?page=1`, purpose: 'Withdrawn amount & available balance; table of withdrawal history' },
  { module: 'Payments', submenu: 'Details (Beta)', screen: 'Payment Details',
    url: `${BASE}/payments/details/calls?page=1&sort=startTime.desc`, purpose: 'Per-transaction detail view filtered by product/payment/session type' },
  { module: 'Payments', submenu: 'Coupons', screen: 'Coupon management',
    url: `${BASE}/payments/coupons/active?page=1`, purpose: 'Create/view active & inactive coupons' },

  // ── Integrations ──────────────────────────────────────────────────────────
  { module: 'Integrations', submenu: '—', screen: 'All Integrations',
    url: `${BASE}/integrations/add-new/all`, purpose: 'Connect calendar/conferencing/communication tools' },

  // ── My Blogs ──────────────────────────────────────────────────────────────
  { module: 'My Blogs', submenu: 'Published', screen: 'Published Articles',
    url: `${BASE}/myblogs/published`, purpose: 'View/manage published blog posts' },
  { module: 'My Blogs', submenu: 'Drafts', screen: 'Draft Articles',
    url: `${BASE}/myblogs/drafts`, purpose: 'Manage unpublished drafts' },
  { module: 'My Blogs', submenu: 'Deleted', screen: 'Deleted Articles',
    url: `${BASE}/myblogs/deleted`, purpose: 'Recover or permanently remove deleted posts' },

  // ── Admin Panel ───────────────────────────────────────────────────────────
  // URLs are educated guesses based on Tealfeed's routing pattern.
  // Scanner skips any that 404.
  { module: 'Admin Panel', submenu: 'Dashboard > Overall', screen: 'Overall Analytics Dashboard',
    url: `${BASE}/admin-panel/dashboard/overall`, purpose: 'Org-wide KPIs: total earnings, on/off-platform, total clients, sessions by type' },
  { module: 'Admin Panel', submenu: 'Dashboard > Expert', screen: 'Expert Analytics Dashboard',
    url: `${BASE}/admin-panel/dashboard/expert`, purpose: 'Per-member KPIs: earnings, clients, session counts, avg booking value' },
  { module: 'Admin Panel', submenu: 'Dashboard > Client', screen: 'Client Analytics Dashboard',
    url: `${BASE}/admin-panel/dashboard/client`, purpose: 'Client-side KPIs: earnings, sessions by type, bundles sold, cancellation rate' },
  { module: 'Admin Panel', submenu: 'Segment Analysis', screen: 'Segment Filters + Results',
    url: `${BASE}/admin-panel/segment-analysis`, purpose: 'Filter clients by expert/product/date; create segment; download results' },
  { module: 'Admin Panel', submenu: 'Team Members', screen: 'Team Members',
    url: `${BASE}/admin-panel/members/active?page=1`, purpose: 'View/invite/manage team members; search; export' },
  { module: 'Admin Panel', submenu: 'Payments > Payment Gateways', screen: 'Payment Gateways',
    url: `${BASE}/admin-panel/payment-methods/list`, purpose: 'Install/manage payment processors: Tealfeed Pay, Easebuzz, Razorpay' },
  { module: 'Admin Panel', submenu: 'Payments > Deductions', screen: 'Deductions',
    url: `${BASE}/admin-panel/payment-methods/deductions`, purpose: 'Configure deduction rules for payouts' },
  { module: 'Admin Panel', submenu: 'Payments > Statuses (Beta)', screen: 'Payment Statuses',
    url: `${BASE}/admin-panel/payment-methods/statuses`, purpose: 'View/manage payment status labels' },
  { module: 'Admin Panel', submenu: 'Manage Payout', screen: 'Manage Payout',
    url: `${BASE}/admin-panel/payout/manage`, purpose: 'Handle payout distribution to team members' },
  { module: 'Admin Panel', submenu: 'Global Defaults > Categories', screen: 'Service Categories',
    url: `${BASE}/admin-panel/global-defaults/categories`, purpose: 'Create color-coded categories for services' },
  { module: 'Admin Panel', submenu: 'Global Defaults > Templates', screen: 'Session/notification templates',
    url: `${BASE}/admin-panel/global-defaults/templates`, purpose: 'Manage message/notification templates' },
  { module: 'Admin Panel', submenu: 'Global Defaults > Client Settings (Beta)', screen: 'Client Settings',
    url: `${BASE}/admin-panel/global-defaults/client-settings`, purpose: 'Beta client-facing settings configuration' },
  { module: 'Admin Panel', submenu: 'Form Templates', screen: 'Form Template library',
    url: `${BASE}/admin-panel/forms/templates`, purpose: 'Create reusable intake/form templates' },
  { module: 'Admin Panel', submenu: 'Form Builder', screen: 'Form Builder',
    url: `${BASE}/admin-panel/forms/builder`, purpose: 'Build custom intake/session forms with drag-and-drop fields' },
  { module: 'Admin Panel', submenu: 'Org Settings', screen: 'Organization Settings',
    url: `${BASE}/admin-panel/org-settings`, purpose: 'Logo, org name, coupon toggle, admin notifications, reschedule/cancel policy' },
];

// ─── Merge into existing sitemap ──────────────────────────────────────────────

const existing = JSON.parse(fs.readFileSync(SITEMAP_F, 'utf8'));
const existingKeys = new Set(
  existing.sitemap.map(s => `${s.module}|${s.screen}`)
);

let added = 0;
let idx   = existing.sitemap.length + 1;

for (const screen of ALL_SCREENS) {
  const key = `${screen.module}|${screen.screen}`;
  if (existingKeys.has(key)) continue; // already in sitemap

  existing.sitemap.push({
    index:      idx++,
    module:     screen.module,
    submenu:    screen.submenu,
    screen:     screen.screen,
    url:        screen.url,
    purpose:    screen.purpose,
    screenshot: null,
    navPath:    [screen.module, screen.submenu].filter(s => s && s !== '—'),
  });
  added++;
}

existing.mergedAt = new Date().toISOString();
fs.writeFileSync(SITEMAP_F, JSON.stringify(existing, null, 2));

console.log(`✅ Merged ${added} new screens into phase1_sitemap.json`);
console.log(`   Total screens in sitemap: ${existing.sitemap.length}`);
console.log(`\nNow run: node scanner.js --phase 2 --all-modules`);
console.log('(Already-captured screens will be skipped — only new ones will be scanned)');
