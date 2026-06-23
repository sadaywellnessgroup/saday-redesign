/**
 * Report generator — converts scanner JSON output to split markdown files.
 *
 * Output layout (inside scanner/output/<crm>/reports/):
 *   00_index.md          Stats summary + links to every section
 *   01_sitemap.md        Phase 1 nav map
 *   02_screens/
 *     <module>.md        One file per module (avoids giant walls of text)
 *   03_features.md       Features matrix (deduplicated)
 *   04_fields.md         Data-fields table (deduplicated)
 *   05_integrations.md   Integrations table
 *   06_design_audit.md   Per-screen visual / accessibility analysis
 *
 * Raw JSON data lives in reports/data/ (written by scanner.js).
 *
 * Usage:
 *   node report.js                    # Tealfeed (default)
 *   node report.js --crm swasthmind   # SwasthMind
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const _args   = process.argv.slice(2);
const _crmIdx = _args.indexOf('--crm');
const _crmKey = _crmIdx !== -1 ? _args[_crmIdx + 1] : 'tealfeed';

const CRM_NAMES = { tealfeed: 'Tealfeed', swasthmind: 'SwasthMind CRM' };
const CRM_NAME  = CRM_NAMES[_crmKey] || _crmKey;

const REPORTS_DIR  = path.join(__dirname, 'output', _crmKey, 'reports');
const DATA_DIR     = path.join(REPORTS_DIR, 'data');
const SCREENS_DIR  = path.join(REPORTS_DIR, '02_screens');

const TIMESTAMP = new Date().toISOString();
const HEADER    = `_${CRM_NAME} · Generated ${TIMESTAMP}_\n\n`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadJson(file) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function cell(val) {
  if (val === undefined || val === null || val === '') return '—';
  return String(val).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function mdTable(headers, rows) {
  if (!rows.length) return '_No data._\n';
  const header = '| ' + headers.join(' | ') + ' |';
  const sep    = '|' + headers.map(() => '---|').join('');
  const body   = rows.map(row => '| ' + row.map(cell).join(' | ') + ' |').join('\n');
  return [header, sep, body].join('\n') + '\n';
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log(`  ✔  ${path.relative(path.join(__dirname, 'output'), filePath)}`);
}

// ─── 01 — Sitemap ─────────────────────────────────────────────────────────────

function buildSitemap() {
  const data = loadJson('phase1_sitemap.json');

  let out = `# ${CRM_NAME} — Sitemap\n\n${HEADER}`;

  if (!data) {
    out += '> Phase 1 has not been run yet. Execute `node scanner.js --phase 1` first.\n';
    return { content: out, count: 0 };
  }

  const rows = data.sitemap.map(s => [
    s.index, s.module, s.submenu, s.screen,
    '—', s.purpose || '', s.screenshot || '—',
  ]);

  out += mdTable(
    ['#', 'Top nav / module', 'Submenu', 'Screen / page', 'Available to roles', 'Purpose (1 line)', 'Screenshot ref'],
    rows
  );

  return { content: out, count: data.sitemap.length };
}

// ─── 02 — Screens (split per module) ─────────────────────────────────────────

function buildScreens(allScreens) {
  const byModule = {};
  for (const s of allScreens) {
    (byModule[s.module] = byModule[s.module] || []).push(s);
  }

  const index = [];  // [ { module, file, count } ]

  for (const [moduleName, screens] of Object.entries(byModule)) {
    const slug = moduleName.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    const file = path.join(SCREENS_DIR, `${slug}.md`);

    let out = `# ${CRM_NAME} — Screens: ${moduleName}\n\n${HEADER}`;
    out += `_${screens.length} screen${screens.length !== 1 ? 's' : ''} in this module._\n\n`;

    for (const s of screens) {
      out += `---\n\n`;
      out += `## ${s.screen}\n\n`;
      out += `- **Module**: ${s.module}\n`;
      out += `- **Path**: ${s.module} > ${s.submenu} > ${s.screen}\n`;
      out += `- **URL**: ${s.url}\n`;
      out += `- **Primary purpose**: [fill in]\n`;
      out += `- **Tabs**: ${s.tabs?.length ? s.tabs.join(', ') : '—'}\n`;

      if (s.tables?.length) {
        const tableHeaders = s.tables.map(t => t.headers?.join(', ') || '(no headers)').join(' | ');
        out += `- **Tables**: ${tableHeaders}\n`;
      }

      out += `- **Actions available**: ${s.actionsAvailable?.slice(0, 12).join(', ') || '—'}\n`;

      if (s.flaggedDestructive?.length) {
        out += `- **⚠️ Destructive actions (not clicked)**: ${s.flaggedDestructive.join(', ')}\n`;
      }

      out += `- **Filters / search**: ${s.filters?.join(', ') || '—'}\n`;

      if (s.forms?.length) {
        out += `- **Forms captured**: ${s.forms.map(f => `"${f.trigger}" (${f.fieldCount} fields: ${f.fields?.slice(0, 5).join(', ')}…)`).join('; ')}\n`;
      }

      out += `- **Screenshot**: ${s.screenshot || '—'}\n`;
      out += `- **Notes / pain points**: \n\n`;
    }

    write(file, out);
    index.push({ module: moduleName, file: path.relative(REPORTS_DIR, file), count: screens.length });
  }

  return index;
}

// ─── 03 — Features ────────────────────────────────────────────────────────────

function buildFeatures(allFeatures) {
  let out = `# ${CRM_NAME} — Features Matrix\n\n${HEADER}`;

  const seen = new Set();
  const unique = allFeatures.filter(f => {
    const key = `${f.module}|${f.subCapability}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!unique.length) {
    out += '> No features data yet — run Phase 2 first.\n';
    return { content: out, count: 0 };
  }

  // Group by module for readability
  const byModule = {};
  for (const f of unique) {
    (byModule[f.module] = byModule[f.module] || []).push(f);
  }

  for (const [mod, features] of Object.entries(byModule)) {
    out += `## ${mod}\n\n`;
    out += mdTable(
      ['Feature', 'Sub-capability', 'Present?', 'Quality (1-5)', 'Notes'],
      features.map(f => [f.feature, f.subCapability, f.present, f.quality || '', f.notes || ''])
    );
    out += '\n';
  }

  return { content: out, count: unique.length };
}

// ─── 04 — Data fields ─────────────────────────────────────────────────────────

function buildFields(allFields) {
  let out = `# ${CRM_NAME} — Data Fields\n\n${HEADER}`;

  const seen = new Set();
  const unique = allFields.filter(f => {
    const key = `${f.entity}|${f.field}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!unique.length) {
    out += '> No field data yet — run Phase 2 first.\n';
    return { content: out, count: 0 };
  }

  // Group by entity
  const byEntity = {};
  for (const f of unique) {
    (byEntity[f.entity] = byEntity[f.entity] || []).push(f);
  }

  for (const [entity, fields] of Object.entries(byEntity)) {
    out += `## ${entity}\n\n`;
    out += mdTable(
      ['Field', 'Type', 'Required?', 'Enum values', 'PHI?', 'Source screen', 'Notes'],
      fields.map(f => [f.field, f.type, f.required, f.enumValues || '', f.phi, f.sourceScreen, f.notes || ''])
    );
    out += '\n';
  }

  return { content: out, count: unique.length };
}

// ─── 05 — Integrations ────────────────────────────────────────────────────────

function buildIntegrations(allIntegrations) {
  let out = `# ${CRM_NAME} — Integrations\n\n${HEADER}`;

  const seen = new Set();
  const unique = allIntegrations.filter(i => {
    if (seen.has(i.vendor)) return false;
    seen.add(i.vendor);
    return true;
  });

  if (!unique.length) {
    out += '> No integrations detected yet — run Phase 2 first.\n';
    return { content: out, count: 0 };
  }

  out += mdTable(
    ['Category', 'Function', 'Vendor', 'Direction', 'Protocol', 'BAA required?', 'Notes'],
    unique.map(i => [i.category, '', i.vendor, i.direction, '', 'Unknown', i.notes])
  );

  return { content: out, count: unique.length };
}

// ─── 06 — Design audit ────────────────────────────────────────────────────────

function swatch(hex) { return hex ? `\`${hex}\`` : '—'; }

function contrastLabel(ratio) {
  if (ratio === null) return '?';
  if (ratio >= 7)   return `${ratio} ✅ AAA`;
  if (ratio >= 4.5) return `${ratio} ✅ AA`;
  if (ratio >= 3)   return `${ratio} ⚠️ AA Large only`;
  return `${ratio} ❌ Fail`;
}

function buildDesignAudit(allScreens) {
  const audited = allScreens.filter(s => s.designAudit);
  let out = `# ${CRM_NAME} — Design Audit\n\n${HEADER}`;
  out += '_Per-screen visual analysis: colors, typography, layout, components, accessibility._\n\n';

  if (!audited.length) {
    out += '> No design audit data yet — run Phase 2 first.\n';
    return { content: out, count: 0 };
  }

  // Cross-screen summary
  const allFonts = new Set();
  const allBtnVariants = new Set();
  const issueCount = { total: 0, byType: {} };
  let totalMissingAlt = 0, totalMissingLabel = 0;

  for (const s of audited) {
    const d = s.designAudit;
    d.typography?.fontFamilies?.forEach(f => allFonts.add(f));
    d.buttonVariants?.forEach(v => allBtnVariants.add(v));
    d.consistencyIssues?.forEach(issue => {
      issueCount.total++;
      const key = issue.replace(/\d+/g, 'N');
      issueCount.byType[key] = (issueCount.byType[key] || 0) + 1;
    });
    totalMissingAlt   += d.accessibility?.imgsMissingAlt || 0;
    totalMissingLabel += d.accessibility?.inputsMissingLabel || 0;
  }

  out += '## Cross-screen summary\n\n';
  out += `| Signal | Value |\n|--------|-------|\n`;
  out += `| Screens audited | ${audited.length} |\n`;
  out += `| Font families in use | ${[...allFonts].join(', ') || '—'} |\n`;
  out += `| Button variants seen | ${[...allBtnVariants].join(', ') || '—'} |\n`;
  out += `| Total images missing alt | ${totalMissingAlt} |\n`;
  out += `| Total inputs missing label | ${totalMissingLabel} |\n`;
  out += `| Total consistency issues | ${issueCount.total} |\n\n`;

  if (Object.keys(issueCount.byType).length) {
    out += '**Recurring issues:**\n\n';
    for (const [issue, count] of Object.entries(issueCount.byType).sort((a, b) => b[1] - a[1])) {
      out += `- ${issue} _(${count} screen${count > 1 ? 's' : ''})_\n`;
    }
    out += '\n';
  }

  // Per-screen entries
  for (const s of audited) {
    const d = s.designAudit;
    out += `---\n\n## 🎨 ${s.module} › ${s.screen}\n\n`;

    out += '**Colors**\n\n';
    out += mdTable(
      ['Role', 'Hex', 'Count'],
      [
        ...d.colors.topTextColors.slice(0, 5).map(c => ['Text', swatch(c.hex), c.count]),
        ...d.colors.topBgColors.slice(0, 5).map(c  => ['Background', swatch(c.hex), c.count]),
      ]
    );
    out += `_Unique text colors: ${d.colors.uniqueTextColors} | Unique bg colors: ${d.colors.uniqueBgColors}_\n\n`;

    out += '**Typography**\n\n';
    out += `| Property | Values |\n|----------|--------|\n`;
    out += `| Font families | ${d.typography.fontFamilies.join(', ') || '—'} |\n`;
    out += `| Font weights | ${d.typography.fontWeights.join(', ') || '—'} |\n`;
    out += `| Unique font sizes | ${d.typography.uniqueFontSizeCount} |\n`;
    const topSizes = d.typography.topFontSizes.slice(0, 5).map(s => `${s.size}(×${s.count})`).join(', ');
    out += `| Top font sizes | ${topSizes || '—'} |\n\n`;

    out += '**Layout**\n\n';
    out += `| Property | Value |\n|----------|-------|\n`;
    out += `| Layout type | ${d.layout.type} |\n`;
    out += `| Flex containers | ${d.layout.flexCount} |\n`;
    out += `| Grid containers | ${d.layout.gridCount} |\n`;
    if (d.layout.cardPaddings?.length) out += `| Card padding | ${d.layout.cardPaddings.join(', ')} |\n`;
    out += '\n';

    out += '**Components**\n\n';
    const compRows = Object.entries(d.components).filter(([, v]) => v > 0)
      .map(([name, count]) => [name.replace(/([A-Z])/g, ' $1').trim(), count]);
    out += mdTable(['Component', 'Count'], compRows);
    if (d.buttonVariants?.length) out += `_Button variants: ${d.buttonVariants.join(', ')}_\n`;
    out += '\n';

    out += '**Accessibility**\n\n';
    out += `| Check | Result |\n|-------|--------|\n`;
    out += `| Body contrast ratio | ${contrastLabel(d.accessibility.bodyContrastRatio)} |\n`;
    out += `| Body text color | ${swatch(d.accessibility.bodyColor)} |\n`;
    out += `| Body background | ${swatch(d.accessibility.bodyBg)} |\n`;
    out += `| Images missing alt | ${d.accessibility.imgsMissingAlt === 0 ? '0 ✅' : `${d.accessibility.imgsMissingAlt} ❌`} |\n`;
    out += `| Inputs missing label | ${d.accessibility.inputsMissingLabel === 0 ? '0 ✅' : `${d.accessibility.inputsMissingLabel} ⚠️`} |\n`;
    out += `| Interactive divs missing role | ${d.accessibility.interactivesMissingRole === 0 ? '0 ✅' : `${d.accessibility.interactivesMissingRole} ⚠️`} |\n\n`;

    if (d.consistencyIssues?.length) {
      out += '**Consistency issues**\n\n';
      for (const issue of d.consistencyIssues) out += `- ⚠️ ${issue}\n`;
      out += '\n';
    } else {
      out += '_No consistency issues flagged._\n\n';
    }
  }

  return { content: out, count: audited.length };
}

// ─── 00 — Index ───────────────────────────────────────────────────────────────

function buildIndex(stats, screenIndex) {
  let out = `# ${CRM_NAME} — Report Index\n\n${HEADER}`;

  out += '## Stats\n\n';
  out += `| Section | Count |\n|---------|-------|\n`;
  out += `| Sitemap entries | ${stats.sitemap} |\n`;
  out += `| Screens captured | ${stats.screens} |\n`;
  out += `| Feature rows | ${stats.features} |\n`;
  out += `| Data fields | ${stats.fields} |\n`;
  out += `| Integrations | ${stats.integrations} |\n`;
  out += `| Screens audited (design) | ${stats.audited} |\n\n`;

  out += '## Files\n\n';
  out += `| File | Description |\n|------|-------------|\n`;
  out += `| [01_sitemap.md](01_sitemap.md) | Phase 1 navigation map (${stats.sitemap} entries) |\n`;

  if (screenIndex.length) {
    out += `| **02_screens/** | Per-module screen inventory |\n`;
    for (const { module, file, count } of screenIndex) {
      out += `| &nbsp;&nbsp;[${path.basename(file)}](${file}) | ${module} — ${count} screen${count !== 1 ? 's' : ''} |\n`;
    }
  } else {
    out += `| 02_screens/ | _(empty — run Phase 2)_ |\n`;
  }

  out += `| [03_features.md](03_features.md) | Features matrix (${stats.features} rows) |\n`;
  out += `| [04_fields.md](04_fields.md) | Data fields (${stats.fields} rows) |\n`;
  out += `| [05_integrations.md](05_integrations.md) | Integrations (${stats.integrations} vendors) |\n`;
  out += `| [06_design_audit.md](06_design_audit.md) | Design &amp; accessibility audit (${stats.audited} screens) |\n\n`;

  out += '## Raw data\n\n';
  out += 'JSON source files are in `reports/data/`:\n\n';
  out += '- `data/phase1_sitemap.json`\n';
  out += '- `data/phase2_<module>_screens.json`\n';
  out += '- `data/phase2_<module>_features.json`\n';
  out += '- `data/phase2_<module>_fields.json`\n';
  out += '- `data/phase2_<module>_integrations.json`\n';
  out += '- `data/debug_sidebar.html` _(nav debug dump from Phase 1)_\n';

  return out;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// Ensure output dirs exist
fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.mkdirSync(SCREENS_DIR, { recursive: true });

if (!fs.existsSync(DATA_DIR)) {
  console.error(`No data found at ${DATA_DIR}`);
  console.error(`Run scanner first: node scanner.js --crm ${_crmKey} --phase 1`);
  process.exit(1);
}

// Aggregate all phase2 data files
const dataFiles = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('phase2_') && f.endsWith('_screens.json'));
let allScreens = [], allFeatures = [], allFields = [], allIntegrations = [];

for (const file of dataFiles) {
  const base = file.replace('_screens.json', '');
  allScreens.push(...(loadJson(`${base}_screens.json`)      || []));
  allFeatures.push(...(loadJson(`${base}_features.json`)    || []));
  allFields.push(...(loadJson(`${base}_fields.json`)        || []));
  allIntegrations.push(...(loadJson(`${base}_integrations.json`) || []));
}

console.log(`\nGenerating reports for ${CRM_NAME} → output/${_crmKey}/reports/\n`);

const { content: sitemapMd,    count: sitemapCount }    = buildSitemap();
const { content: featuresMd,   count: featuresCount }   = buildFeatures(allFeatures);
const { content: fieldsMd,     count: fieldsCount }     = buildFields(allFields);
const { content: integrationsMd, count: intCount }      = buildIntegrations(allIntegrations);
const { content: auditMd,      count: auditCount }      = buildDesignAudit(allScreens);

const screenIndex = buildScreens(allScreens);  // also writes files

write(path.join(REPORTS_DIR, '01_sitemap.md'),       sitemapMd);
write(path.join(REPORTS_DIR, '03_features.md'),      featuresMd);
write(path.join(REPORTS_DIR, '04_fields.md'),        fieldsMd);
write(path.join(REPORTS_DIR, '05_integrations.md'),  integrationsMd);
write(path.join(REPORTS_DIR, '06_design_audit.md'),  auditMd);

const indexMd = buildIndex(
  { sitemap: sitemapCount, screens: allScreens.length, features: featuresCount,
    fields: fieldsCount, integrations: intCount, audited: auditCount },
  screenIndex
);
write(path.join(REPORTS_DIR, '00_index.md'), indexMd);

console.log(`\nDone. ${allScreens.length} screens · ${featuresCount} features · ${fieldsCount} fields · ${intCount} integrations`);
