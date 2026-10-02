// Project export to a local folder for VS Code (REQ-012, DEC-09): POST /api/export/folder.
// Every export is a new folder; an existing folder — including earlier exports the learner now
// edits locally — is never written to.
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError, readJson } from '../http-util.mjs';
import { validateFiles, writeFiles } from './lib/project-files.mjs';

export const MANIFEST_NAME = 'jsll-manifest.json';
const MAX_FILES = 1000;
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 256 * 1024;

/** Folder-name part from a learner-visible project name: letters (any script), digits, ".", "_", "-". */
export function safeName(name) {
  const cleaned = String(name ?? '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 60)
    .replace(/[-.]+$/g, '');
  if (cleaned === '' || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(cleaned)) return 'project';
  return cleaned;
}

const pad = (n) => String(n).padStart(2, '0');
export const stamp = (d = new Date()) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

/** Create a brand-new folder `<base>`, `<base>-2`, `<base>-3`… atomically (mkdir fails if it exists). */
async function createUniqueFolder(parent, base) {
  for (let i = 1; i <= 100; i++) {
    const candidate = path.join(parent, i === 1 ? base : `${base}-${i}`);
    try {
      await fs.mkdir(candidate);
      return candidate;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  throw new HttpError(409, 'export-exists', `Too many exports named ${base} in the same second.`);
}

export async function exportFolder({ exportsDir, name, files, manifest, now = new Date() }) {
  const entries = validateFiles(files, { maxFiles: MAX_FILES, maxBytes: MAX_BYTES, reserved: [MANIFEST_NAME] });
  if (manifest === undefined) manifest = {};
  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) throw new HttpError(400, 'bad-manifest', '"manifest" must be an object.');
  if (Buffer.byteLength(JSON.stringify(manifest)) > MAX_MANIFEST_BYTES) throw new HttpError(413, 'too-large', `The manifest exceeds ${MAX_MANIFEST_BYTES} bytes.`);
  await fs.mkdir(exportsDir, { recursive: true });
  const folder = await createUniqueFolder(exportsDir, `${safeName(name)}-${stamp(now)}`);
  try {
    await writeFiles(folder, entries);
    const record = {
      ...manifest,
      format: 'jsll-export',
      formatVersion: 1,
      exportedAt: now.toISOString(),
      files: entries.map((e) => ({ path: e.path, bytes: e.bytes, sha256: createHash('sha256').update(e.text, 'utf8').digest('hex') })),
    };
    await fs.writeFile(path.join(folder, MANIFEST_NAME), `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
    return { path: folder, folderName: path.basename(folder), fileCount: entries.length };
  } catch (error) {
    // The folder was created by this request a moment ago: nothing else can be lost by removing it.
    await fs.rm(folder, { recursive: true, force: true }).catch(() => {});
    if (error instanceof HttpError) throw error;
    throw new HttpError(507, 'export-failed', `The export could not be written: ${error.message}. Nothing was changed in earlier exports.`);
  }
}

export async function register(api) {
  api.features.exportFolder = { available: true, limits: { files: MAX_FILES, totalBytes: MAX_BYTES } };
  api.route('POST', '/api/export/folder', async ({ req }) => {
    const body = await readJson(req, 3 * MAX_BYTES);
    if (body.name !== undefined && typeof body.name !== 'string') throw new HttpError(400, 'bad-request', '"name" must be a string.');
    return exportFolder({ exportsDir: api.config.exportsDir, name: body.name, files: body.files ?? {}, manifest: body.manifest });
  });
}
