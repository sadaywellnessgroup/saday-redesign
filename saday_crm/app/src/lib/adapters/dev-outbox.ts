import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const OUTBOX_ROOT = path.join(process.cwd(), '.dev-outbox');

/** Every Stub* adapter writes here instead of calling a real API
 * (architecture.md §4). Never throws — a dev-outbox write failure must
 * never break the calling flow. */
export async function writeOutbox(kind: string, payload: Record<string, unknown>): Promise<string> {
  const id = randomUUID();
  try {
    const dir = path.join(OUTBOX_ROOT, kind);
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${Date.now()}-${id}.json`),
      JSON.stringify({ id, at: new Date().toISOString(), ...payload }, null, 2),
      'utf8',
    );
  } catch {
    // dev-only convenience; swallow filesystem errors (e.g. read-only edge runtime)
  }
  return id;
}
