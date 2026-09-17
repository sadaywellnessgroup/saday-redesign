/**
 * Saday Worksheets — Build Script (generic Saday branding, D-006)
 *
 * Port of the original doctor-branded pipeline (Handlebars + Puppeteer +
 * pngjs) to this repo's CRM stack: playwright-core (Chromium already
 * installed at /opt/pw-browsers/chromium — never runs `playwright install`)
 * + sharp for image re-encoding/thumbnails. No doctor JSON, no doctor
 * photo/name/registration anywhere in the output — header/footer carry
 * only the generic Saday identity (logo, "Saday Wellness" wordmark,
 * sadaywellness.com, a page code). Doctor-individualised versions are a
 * later job (see README.md).
 *
 *   node scripts/build.js                → all canvases
 *   node scripts/build.js --only mood-tracker   → one worksheet (by slug)
 *
 * Output:
 *   app/public/materials/worksheets/<slug>.pdf   (A4, print-ready)
 *   app/public/materials/thumbs/<slug>.jpg       (480px-wide JPEG)
 *   output/content-manifest.json                 (debug: derived id/title/code list)
 */

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const sharp = require('sharp');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '..', '..');
const CANVAS_DIR = path.join(ROOT, 'assets', 'canvases');
const LOGO_PATH = path.join(ROOT, 'assets', 'logos', 'saday-logo.png');
const TEMPLATE_PATH = path.join(ROOT, 'template', 'worksheet-template.html');

const PDF_OUT_DIR = path.join(REPO_ROOT, 'app', 'public', 'materials', 'worksheets');
const THUMB_OUT_DIR = path.join(REPO_ROOT, 'app', 'public', 'materials', 'thumbs');
const MANIFEST_OUT = path.join(ROOT, 'output', 'content-manifest.json');

const CHROMIUM_PATH = '/opt/pw-browsers/chromium';

// Fonts embedded from the main app's @fontsource packages so the PDF
// pipeline never depends on network access to Google Fonts.
const FONT_DIR = path.join(REPO_ROOT, 'app', 'node_modules', '@fontsource');
const MUKTA_REGULAR = path.join(FONT_DIR, 'mukta', 'files', 'mukta-latin-400-normal.woff2');
const MUKTA_BOLD = path.join(FONT_DIR, 'mukta', 'files', 'mukta-latin-700-normal.woff2');
const FRAUNCES_BOLD = path.join(FONT_DIR, 'fraunces', 'files', 'fraunces-latin-700-normal.woff2');

const CANVAS_JPEG_WIDTH = 1600; // downscale target so PDFs stay small (~150-350 KB)
const CANVAS_JPEG_QUALITY = 85;
const THUMB_WIDTH = 480;

// ─────────────────────────────────────────────────────────────
// small helpers
// ─────────────────────────────────────────────────────────────

function fileToDataUri(filePath, mimeType) {
    const data = fs.readFileSync(filePath).toString('base64');
    return `data:${mimeType};base64,${data}`;
}

/** "mood-tracker.png" style filenames -> Title Case words, fixing the
 * couple of known typos in the source Canva export filenames. */
const TITLE_FIXES = {
    'Mindfullness Exercise': 'Mindfulness Exercise',
};

function titleFromFilename(baseName) {
    const raw = baseName
        .replace(/[-_]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
    const titled = raw
        .split(' ')
        .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
        .join(' ');
    return TITLE_FIXES[titled] || titled;
}

function slugify(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** Discover worksheets straight from the canvases folder — content JSON
 * is derived automatically, never hand-authored. A canvas with a trailing
 * space before its extension (a duplicate export) is skipped in favour of
 * the identically-named file without the trailing space. */
function discoverWorksheets() {
    const files = fs.readdirSync(CANVAS_DIR).filter((f) => f.toLowerCase().endsWith('.png'));

    const seenBaseNames = new Set(
        files
            .map((f) => f.replace(/\.png$/i, ''))
            .filter((n) => !n.endsWith(' '))
            .map((n) => n.trim()),
    );

    const worksheets = [];
    for (const file of files) {
        const baseName = file.replace(/\.png$/i, '');
        const trimmed = baseName.trim();
        if (baseName.endsWith(' ') && seenBaseNames.has(trimmed)) {
            continue; // duplicate export with a trailing-space filename
        }
        const title = titleFromFilename(trimmed);
        const id = slugify(title);
        worksheets.push({ id, title, canvasFile: file });
    }

    worksheets.sort((a, b) => a.id.localeCompare(b.id));
    worksheets.forEach((w, i) => {
        w.code = `SW-${String(i + 1).padStart(2, '0')}`;
    });
    return worksheets;
}

// ─────────────────────────────────────────────────────────────
// render
// ─────────────────────────────────────────────────────────────

async function renderCanvasDataUri(canvasAbsPath) {
    const buf = await sharp(canvasAbsPath)
        .resize({ width: CANVAS_JPEG_WIDTH })
        .jpeg({ quality: CANVAS_JPEG_QUALITY })
        .toBuffer();
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function buildOne(worksheet, template, logoSrc, browser) {
    const canvasAbs = path.join(CANVAS_DIR, worksheet.canvasFile);
    if (!fs.existsSync(canvasAbs)) {
        throw new Error(`Canvas PNG missing: ${canvasAbs}`);
    }
    const canvasSrc = await renderCanvasDataUri(canvasAbs);

    const html = template({
        title: worksheet.title,
        code: worksheet.code,
        canvasSrc,
        logoSrc,
        muktaRegularSrc: fileToDataUri(MUKTA_REGULAR, 'font/woff2'),
        muktaBoldSrc: fileToDataUri(MUKTA_BOLD, 'font/woff2'),
        frauncesBoldSrc: fileToDataUri(FRAUNCES_BOLD, 'font/woff2'),
    });

    const page = await browser.newPage();
    // A4 at 96 CSS-dpi (210mm x 297mm), exactly matching the .page element,
    // so the fullPage:false screenshot used for the thumbnail has no
    // extra whitespace around it.
    await page.setViewportSize({ width: 794, height: 1123 });
    await page.setContent(html, { waitUntil: 'networkidle', timeout: 60000 });
    await page.emulateMedia({ media: 'print' });

    const pdfPath = path.join(PDF_OUT_DIR, `${worksheet.id}.pdf`);
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    // Thumbnail: screenshot the same rendered page (header/footer + canvas)
    // rather than the raw canvas, so it matches what the PDF looks like.
    const screenshotBuf = await page.screenshot({ fullPage: false, type: 'png' });
    await page.close();

    const thumbPath = path.join(THUMB_OUT_DIR, `${worksheet.id}.jpg`);
    await sharp(screenshotBuf).resize({ width: THUMB_WIDTH }).jpeg({ quality: 82 }).toFile(thumbPath);

    const bytes = fs.statSync(pdfPath).size;
    return { ...worksheet, bytes };
}

// ─────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────

function parseArgs(argv) {
    const args = argv.slice(2);
    const out = { only: null };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--only') out.only = args[++i];
    }
    return out;
}

async function main() {
    const { only } = parseArgs(process.argv);

    fs.mkdirSync(PDF_OUT_DIR, { recursive: true });
    fs.mkdirSync(THUMB_OUT_DIR, { recursive: true });
    fs.mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });

    let worksheets = discoverWorksheets();
    if (only) worksheets = worksheets.filter((w) => w.id === only);

    if (worksheets.length === 0) {
        console.error('No worksheets found (check --only or assets/canvases/).');
        process.exit(1);
    }

    console.log(`Worksheets: ${worksheets.length}`);

    const templateSrc = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const template = Handlebars.compile(templateSrc);
    const logoSrc = fileToDataUri(LOGO_PATH, 'image/png');

    console.log(`Launching Chromium from ${CHROMIUM_PATH} ...`);
    const browser = await chromium.launch({
        executablePath: CHROMIUM_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const results = [];
    let ok = 0;
    let fail = 0;
    try {
        for (const ws of worksheets) {
            try {
                console.log(`\n-> ${ws.id} (${ws.code})`);
                const result = await buildOne(ws, template, logoSrc, browser);
                const kb = Math.round(result.bytes / 1024);
                console.log(`   OK  ${ws.id}.pdf (${kb} KB)`);
                results.push(result);
                ok++;
            } catch (e) {
                console.error(`   FAIL ${ws.id}: ${e.message}`);
                fail++;
            }
        }
    } finally {
        await browser.close();
    }

    fs.writeFileSync(
        MANIFEST_OUT,
        JSON.stringify(
            results.map((r) => ({ id: r.id, title: r.title, code: r.code, canvasFile: r.canvasFile, bytes: r.bytes })),
            null,
            2,
        ),
    );

    const totalKB = Math.round(results.reduce((sum, r) => sum + r.bytes, 0) / 1024);
    console.log(`\n${ok} succeeded, ${fail} failed. Total PDF size: ${totalKB} KB.`);
    if (fail > 0) process.exit(1);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
