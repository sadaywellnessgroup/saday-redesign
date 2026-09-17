# Saday Worksheets

Generates the generic Saday-branded therapy worksheet PDFs (D-006: no
doctor name/photo/registration — just the Saday logo, "Saday Wellness"
wordmark, and a footer). Doctor-individualised versions are a **later
job**, not built here.

## Regenerate

```sh
cd tools/worksheets
npm install
npm run build
```

Outputs go straight into the main app:

- `app/public/materials/worksheets/<slug>.pdf` — A4 PDF, print-ready
- `app/public/materials/thumbs/<slug>.jpg` — 480px-wide JPEG thumbnail
- `output/content-manifest.json` — debug: derived id/title/code/bytes per canvas

Rebuild one worksheet only: `node scripts/build.js --only mood-tracker`.

The script launches the Chromium already installed at
`/opt/pw-browsers/chromium` (never runs `playwright install`).

## Add a canvas

Drop the exported Canva PNG into `assets/canvases/`. The id, title and
footer code are all derived automatically from the filename (Title Case,
slugified) — there's no content JSON to hand-write. Re-run `npm run
build`. If the new worksheet should appear in the app, also add a fixture
entry in `app/src/lib/repos/fixtures/files-materials-messages.ts`
(`materialsLibrary`), picking a tag from the existing small taxonomy
(anxiety / mood / mindfulness / journaling / behaviour / self-esteem /
safety / goals / sleep).

Canvases should leave the top ~25mm and bottom ~8mm of the page blank —
that's where the header/footer overlay sits.
