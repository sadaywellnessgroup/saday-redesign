import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const MAX_UPLOAD_BYTES = 26_214_400; // 25 MiB (D-007)

export const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export interface FileStorage {
  createUploadUrl(a: {
    bucket: 'phi' | 'materials';
    path: string;
    mime: string;
    bytes: number;
  }): Promise<{ uploadUrl: string; path: string }>;
  createSignedDownloadUrl(a: {
    bucket: 'phi' | 'materials';
    path: string;
    ttlSeconds: number;
  }): Promise<{ url: string; expiresAt: string }>;
  remove(a: { bucket: 'phi' | 'materials'; path: string }): Promise<void>;
}

const STORAGE_ROOT = path.join(process.cwd(), '.dev-storage');

/** Local filesystem under .dev-storage/ (architecture.md §4). Rejects
 * oversized or disallowed-MIME uploads the same way the real Supabase
 * Storage policy will. */
export class StubFileStorage implements FileStorage {
  async createUploadUrl(a: { bucket: 'phi' | 'materials'; path: string; mime: string; bytes: number }) {
    if (a.bytes > MAX_UPLOAD_BYTES) {
      throw new Error(`file exceeds ${MAX_UPLOAD_BYTES} bytes (25 MiB)`);
    }
    if (!(ALLOWED_MIME as readonly string[]).includes(a.mime)) {
      throw new Error(`mime type not allowed: ${a.mime}`);
    }
    const dir = path.join(STORAGE_ROOT, a.bucket, path.dirname(a.path));
    await mkdir(dir, { recursive: true });
    // The stub has no real HTTP upload endpoint; callers in dev write the
    // file directly via `writeLocal` below. `uploadUrl` is a local marker.
    return { uploadUrl: `local://.dev-storage/${a.bucket}/${a.path}`, path: a.path };
  }

  async writeLocal(bucket: 'phi' | 'materials', filePath: string, data: Buffer | string) {
    const full = path.join(STORAGE_ROOT, bucket, filePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
  }

  async createSignedDownloadUrl(a: { bucket: 'phi' | 'materials'; path: string; ttlSeconds: number }) {
    const expiresAt = new Date(Date.now() + a.ttlSeconds * 1000).toISOString();
    return { url: `local://.dev-storage/${a.bucket}/${a.path}`, expiresAt };
  }

  async remove(): Promise<void> {
    // no-op in the stub; nothing in P1 deletes files
  }
}
