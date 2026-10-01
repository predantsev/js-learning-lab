// Learner file maps ({ "relative/path": "text" }) arriving from the application: validation and
// safe writing. Shared by the Node executor, the type checker and project export.
import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from '../../http-util.mjs';

// Portable across macOS, Linux and Windows (exports are opened in VS Code on any of them).
const FORBIDDEN_CHARS = /[\u0000-\u001f\u007f<>:"|?*\\]/;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

/**
 * Explain why `p` is not a safe relative project path, or return null when it is.
 * Rejects absolute paths, drive letters, `..`, empty or dot segments, backslashes, NUL and other
 * control characters, Windows-reserved names and `.git` (a `.git/config` or hook in an exported
 * folder could run commands as soon as an editor inspects the repository).
 */
export function pathProblem(p) {
  if (typeof p !== 'string' || p.length === 0) return 'empty path';
  if (p.length > 240) return 'path longer than 240 characters';
  if (FORBIDDEN_CHARS.test(p)) return 'path contains a control character, a backslash or one of < > : " | ? *';
  if (p.startsWith('/')) return 'absolute paths are not allowed';
  const segments = p.split('/');
  for (const segment of segments) {
    if (segment === '') return 'empty path segment (leading, trailing or double "/")';
    if (segment === '.' || segment === '..') return '"." and ".." segments are not allowed';
    if (segment.endsWith('.') || segment.endsWith(' ')) return 'segments cannot end with "." or a space';
    if (WINDOWS_RESERVED.test(segment)) return `"${segment}" is a reserved file name on Windows`;
    if (segment.toLowerCase() === '.git') return '".git" folders cannot be written';
  }
  return null;
}

/**
 * Validate a file map and return [{ path, text, bytes }] sorted by path.
 * Also rejects names that collide case-insensitively (they would overwrite each other on macOS
 * and Windows) and a path that is both a file and a folder.
 */
export function validateFiles(files, { maxFiles = 200, maxBytes = 2 * 1024 * 1024, reserved = [], field = 'files' } = {}) {
  if (files === null || typeof files !== 'object' || Array.isArray(files)) throw new HttpError(400, 'bad-files', `"${field}" must be an object mapping relative paths to text.`);
  const entries = Object.entries(files);
  if (entries.length > maxFiles) throw new HttpError(413, 'too-many-files', `At most ${maxFiles} files are allowed (got ${entries.length}).`);
  const out = [];
  const seen = new Map();
  let total = 0;
  for (const [p, text] of entries) {
    const problem = pathProblem(p);
    if (problem) throw new HttpError(400, 'bad-path', `Unsafe file path ${JSON.stringify(p)}: ${problem}.`, { path: p });
    if (typeof text !== 'string') throw new HttpError(400, 'bad-files', `File ${JSON.stringify(p)} must be a string.`, { path: p });
    const key = p.toLowerCase();
    if (seen.has(key)) throw new HttpError(400, 'bad-path', `Paths ${JSON.stringify(seen.get(key))} and ${JSON.stringify(p)} differ only by letter case.`, { path: p });
    if (reserved.some((r) => r.toLowerCase() === key)) throw new HttpError(400, 'bad-path', `${JSON.stringify(p)} is reserved by the platform.`, { path: p });
    seen.set(key, p);
    const bytes = Buffer.byteLength(text, 'utf8');
    total += bytes;
    out.push({ path: p, text, bytes });
  }
  if (total > maxBytes) throw new HttpError(413, 'too-large', `Files total ${total} bytes; the limit is ${maxBytes}.`);
  const keys = new Set(seen.keys());
  for (const key of keys) {
    const parts = key.split('/');
    for (let i = 1; i < parts.length; i++) {
      const prefix = parts.slice(0, i).join('/');
      if (keys.has(prefix)) throw new HttpError(400, 'bad-path', `${JSON.stringify(seen.get(prefix))} is used both as a file and as a folder.`, { path: seen.get(prefix) });
    }
  }
  return out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** Write validated entries below `root` (which must exist). Never follows a path outside `root`. */
export async function writeFiles(root, entries) {
  for (const entry of entries) {
    const file = path.join(root, ...entry.path.split('/'));
    if (!file.startsWith(root + path.sep)) throw new HttpError(400, 'bad-path', `Unsafe file path ${JSON.stringify(entry.path)}.`);
    await fs.mkdir(path.dirname(file), { recursive: true });
    // 'wx' never replaces an existing file: validated maps contain each path once.
    await fs.writeFile(file, entry.text, { encoding: 'utf8', flag: 'wx' });
  }
}

/** Unguessable identifier for scratch folders and runs. */
export const randomId = (prefix) => `${prefix}-${Date.now().toString(36)}-${randomBytes(6).toString('hex')}`;
