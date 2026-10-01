// Small HTTP helpers shared by the platform server modules. No external dependencies.
import fs from 'node:fs/promises';
import path from 'node:path';

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
};

export class HttpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export function sendJson(res, status, body, headers = {}) {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers });
  res.end(text);
}

export function sendText(res, status, text, headers = {}) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers });
  res.end(text);
}

/** Read a request body with a hard size limit. */
export function readBody(req, limitBytes = 6 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new HttpError(413, 'too-large', `Request body exceeds ${limitBytes} bytes.`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function readJson(req, limitBytes) {
  const raw = await readBody(req, limitBytes);
  if (raw.length === 0) return {};
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    throw new HttpError(400, 'bad-json', 'Request body is not valid JSON.');
  }
}

/** Serve a file from `root` (never outside it). Returns false when the file does not exist. */
export async function serveStatic(req, res, root, relPath, headers = {}) {
  const decoded = decodeURIComponent(relPath);
  const file = path.resolve(root, `.${path.posix.normalize(`/${decoded}`)}`);
  if (file !== root && !file.startsWith(root + path.sep)) return false;
  let stat;
  try {
    stat = await fs.stat(file);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;
  const lastModified = stat.mtime.toUTCString();
  const base = { 'content-type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-cache', 'last-modified': lastModified, 'x-content-type-options': 'nosniff', ...headers };
  if (req.headers['if-modified-since'] === lastModified) {
    res.writeHead(304, base);
    res.end();
    return true;
  }
  const body = await fs.readFile(file);
  res.writeHead(200, { ...base, 'content-length': body.length });
  res.end(req.method === 'HEAD' ? undefined : body);
  return true;
}
