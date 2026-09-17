import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { materialsLibrary } from '@/lib/repos/fixtures';

// app/public is the Next.js public root; a fixture storagePath/thumbnailPath
// that starts with "/" is a public URL and resolves to a file directly
// under it (see files-materials-messages.ts).
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

function publicFileFor(publicUrlPath: string): string {
  return path.join(PUBLIC_DIR, publicUrlPath.replace(/^\//, ''));
}

describe('materials library fixtures', () => {
  it('has the 34-worksheet Saday-branded library (D-006)', () => {
    const worksheets = materialsLibrary.filter((m) => m.kind === 'worksheet');
    expect(worksheets.length).toBe(34);
  });

  it('every worksheet storagePath resolves to a real PDF under app/public', () => {
    const worksheets = materialsLibrary.filter((m) => m.kind === 'worksheet');
    for (const material of worksheets) {
      expect(material.storagePath, `${material.id} has no storagePath`).toBeTruthy();
      const filePath = publicFileFor(material.storagePath as string);
      expect(fs.existsSync(filePath), `${material.id}: missing PDF at ${filePath}`).toBe(true);
    }
  });

  it('every worksheet thumbnailPath resolves to a real JPEG under app/public', () => {
    const worksheets = materialsLibrary.filter((m) => m.kind === 'worksheet');
    for (const material of worksheets) {
      expect(material.thumbnailPath, `${material.id} has no thumbnailPath`).toBeTruthy();
      const filePath = publicFileFor(material.thumbnailPath as string);
      expect(fs.existsSync(filePath), `${material.id}: missing thumbnail at ${filePath}`).toBe(true);
    }
  });

  it('every fixture item with a public (/-rooted) storagePath exists on disk', () => {
    // Covers any future non-worksheet material that also uses a public
    // path; PHI storagePaths (files[]) and bucket-key storagePaths
    // (brochure placeholders, no leading "/") are out of scope here.
    for (const material of materialsLibrary) {
      if (material.storagePath && material.storagePath.startsWith('/')) {
        const filePath = publicFileFor(material.storagePath);
        expect(fs.existsSync(filePath), `${material.id}: missing file at ${filePath}`).toBe(true);
      }
      if (material.thumbnailPath) {
        const filePath = publicFileFor(material.thumbnailPath);
        expect(fs.existsSync(filePath), `${material.id}: missing thumbnail at ${filePath}`).toBe(true);
      }
    }
  });

  it('worksheet tags come from the small taxonomy', () => {
    const taxonomy = new Set([
      'anxiety',
      'mood',
      'mindfulness',
      'journaling',
      'behaviour',
      'self-esteem',
      'safety',
      'goals',
      'sleep',
    ]);
    const worksheets = materialsLibrary.filter((m) => m.kind === 'worksheet');
    for (const material of worksheets) {
      expect(material.tags.length, `${material.id} has no tags`).toBeGreaterThan(0);
      for (const tag of material.tags) {
        expect(taxonomy.has(tag), `${material.id}: tag "${tag}" is outside the taxonomy`).toBe(true);
      }
    }
  });

  it('brochure placeholders are marked and have no on-disk file yet', () => {
    const brochures = materialsLibrary.filter((m) => m.kind === 'brochure');
    expect(brochures.length).toBeGreaterThan(0);
    for (const material of brochures) {
      // Placeholder brochures use a bucket-key storagePath (no leading
      // "/"), so they're intentionally not checked against app/public.
      expect(material.storagePath?.startsWith('/')).toBe(false);
      expect(material.thumbnailPath).toBeNull();
    }
  });

  it('has no duplicate material ids', () => {
    const ids = materialsLibrary.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
