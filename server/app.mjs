// Platform HTTP application: static app + compiled content on the app host, the sandbox shell
// and lab fixtures on sandbox hosts, and a token-protected local API. Loopback only.
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { APP_FALLBACK_HOSTNAME, APP_HOSTNAME, DATA_SCHEMA_VERSION, ROOT, appOrigins, classifyHost, loadConfig } from './config.mjs';
import { HttpError, readJson, sendJson, sendText, serveStatic } from './http-util.mjs';
import { createLab } from './lab.mjs';
import { Store, StoreError, isValidDocId } from './store.mjs';

const STORE_ERROR_STATUS = { conflict: 409, 'too-large': 413, 'bad-id': 400, corrupt: 500, 'write-failed': 507, 'disk-full': 507, 'not-ready': 503, 'read-failed': 500 };

export async function createApp(overrides = {}) {
  const config = loadConfig(process.env, overrides);
  const store = await new Store(config.dataDir, { migrations: overrides.migrations ?? [] }).open();
  const appDir = path.join(config.distDir, 'app');
  const contentDir = path.join(config.distDir, 'content');
  const sandboxDir = path.join(config.distDir, 'sandbox');
  let domains = null;
  try {
    domains = JSON.parse(await fs.readFile(path.join(contentDir, 'capstones', 'domains.json'), 'utf8'));
  } catch {
    /* content not built yet: lab collections start empty */
  }
  const lab = createLab({ domains });
  const state = { port: config.port };
  const routes = []; // { method, path, handler }
  const api = {
    config,
    store,
    state,
    /** Register an API route: handler(ctx) → value (sent as JSON) or handles `ctx.res` itself and returns undefined. */
    route(method, routePath, handler) {
      routes.push({ method, path: routePath, handler });
    },
    HttpError,
  };

  // ---- core API ----
  api.route('GET', '/api/bootstrap', async () => ({
    version: JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8')).version,
    schemaVersion: DATA_SCHEMA_VERSION,
    storeState: store.state,
    migrationError: store.migrationError ?? null,
    dataDir: config.dataDir,
    exportsDir: config.exportsDir,
    port: state.port,
    node: process.version,
    platform: process.platform,
    features: Object.fromEntries(Object.entries(api.features ?? {})),
    testHooks: config.testHooks,
  }));
  api.route('GET', '/api/store', async ({ url }) => ({ docs: await store.list(url.searchParams.get('prefix') ?? '') }));
  api.route('GET', '/api/store/doc', async ({ url }) => {
    const id = url.searchParams.get('id');
    if (!isValidDocId(id)) throw new HttpError(400, 'bad-id', 'Invalid document id.');
    const envelope = await store.get(id);
    return envelope === null ? { exists: false } : { exists: true, rev: envelope.rev, updatedAt: envelope.updatedAt, recovered: envelope.recovered === true, data: envelope.data };
  });
  api.route('PUT', '/api/store/doc', async ({ url, req }) => {
    const id = url.searchParams.get('id');
    const body = await readJson(req);
    if (!('data' in body)) throw new HttpError(400, 'bad-body', 'Missing "data".');
    return store.put(id, body.data, { baseRev: body.baseRev ?? null, force: body.force === true });
  });
  api.route('DELETE', '/api/store/doc', async ({ url }) => {
    await store.remove(url.searchParams.get('id'));
    return { ok: true };
  });
  if (config.testHooks) {
    api.route('POST', '/api/__test/fault', async ({ req }) => {
      const body = await readJson(req);
      store.fault = body.mode ?? null;
      return { fault: store.fault };
    });
  }

  // ---- optional API modules (server/api/*.mjs each export `register(api)`) ----
  api.features = {};
  const apiDir = path.join(ROOT, 'server', 'api');
  for (const file of (await fs.readdir(apiDir).catch(() => [])).filter((f) => f.endsWith('.mjs')).sort()) {
    const mod = await import(pathToFileURL(path.join(apiDir, file)).href);
    if (typeof mod.register === 'function') await mod.register(api);
  }

  const appCsp = () => [
    "default-src 'self'",
    "script-src 'self'",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    `frame-src http://127.0.0.1:${state.port} http://*.localhost:${state.port}`,
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "form-action 'self'",
  ].join('; ');

  const sandboxCsp = (host, net) => [
    'sandbox allow-scripts allow-forms',
    "default-src 'none'",
    `script-src 'unsafe-inline' 'unsafe-eval' blob: http://${host}/sandbox/`,
    "style-src 'unsafe-inline'",
    'img-src data: blob:',
    'font-src data:',
    'media-src data: blob:',
    `connect-src ${net === 'lab' ? `http://${host}/lab/` : "'none'"}`,
    `frame-ancestors ${appOrigins(state.port).join(' ')}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');

  async function serveIndex(res) {
    let html;
    try {
      html = await fs.readFile(path.join(appDir, 'index.html'), 'utf8');
    } catch {
      return sendText(res, 503, 'The application is not built yet. Run "npm run build" (or "npm start", which builds automatically).');
    }
    const boot = { token: store.meta.token, port: state.port, appHost: APP_HOSTNAME, fallbackHost: APP_FALLBACK_HOSTNAME };
    const tag = `<script type="application/json" id="jsll-boot">${JSON.stringify(boot).replace(/</g, '\\u003c')}</script>`;
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': appCsp(), 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' });
    res.end(html.replace('<!--JSLL_BOOT-->', tag));
  }

  async function handleApi(req, res, url) {
    const origin = req.headers.origin;
    if (origin !== undefined && !appOrigins(state.port).includes(origin)) throw new HttpError(403, 'bad-origin', 'Cross-origin API access is not allowed.');
    if (req.headers['x-jsll-token'] !== store.meta.token) throw new HttpError(401, 'bad-token', 'Missing or invalid local API token. Reload the application page.');
    const route = routes.find((r) => r.method === req.method && r.path === url.pathname);
    if (!route) throw new HttpError(404, 'not-found', 'Unknown API route.');
    const result = await route.handler({ req, res, url, api });
    if (result !== undefined && !res.headersSent) sendJson(res, 200, result);
  }

  async function handle(req, res) {
    const kind = classifyHost(req.headers.host, state.port);
    if (kind === null) return sendText(res, 421, 'This server only answers on its local addresses.');
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname.startsWith('/lab/')) {
      if (await lab(req, res, url)) return undefined;
      throw new HttpError(404, 'not-found', 'Unknown lab fixture.');
    }

    if (kind === 'sandbox') {
      if (pathname === '/sandbox/frame.html') {
        const ok = await serveStatic(req, res, sandboxDir, 'frame.html', { 'content-security-policy': sandboxCsp(req.headers.host, url.searchParams.get('net')), 'cache-control': 'no-cache' });
        if (!ok) sendText(res, 503, 'Sandbox assets are not built yet.');
        return undefined;
      }
      if (pathname.startsWith('/sandbox/')) {
        // Scripts are loaded by an opaque-origin document, so module scripts need CORS.
        if (await serveStatic(req, res, sandboxDir, pathname.slice('/sandbox/'.length), { 'access-control-allow-origin': '*', 'cross-origin-resource-policy': 'cross-origin' })) return undefined;
        return sendText(res, 404, 'Not found.');
      }
      // The application itself is never served on a sandbox host.
      res.writeHead(302, { location: `http://${APP_FALLBACK_HOSTNAME}:${state.port}${pathname === '/' ? '/' : ''}` });
      return res.end();
    }

    // ---- app host ----
    if (pathname.startsWith('/api/')) return handleApi(req, res, url);
    if (pathname.startsWith('/sandbox/')) return sendText(res, 404, 'Sandbox assets are only served on the sandbox host.');
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'method-not-allowed', 'Method not allowed.');
    if (pathname === '/' || pathname === '/index.html') return serveIndex(res);
    if (pathname.startsWith('/content/')) {
      if (await serveStatic(req, res, contentDir, pathname.slice('/content/'.length))) return undefined;
      return sendJson(res, 404, { error: 'content-not-found', path: pathname });
    }
    if (await serveStatic(req, res, appDir, pathname.slice(1), { 'content-security-policy': appCsp() })) return undefined;
    return sendText(res, 404, 'Not found.');
  }

  const handler = (req, res) => {
    handle(req, res).catch((error) => {
      if (res.headersSent) return res.end();
      if (error instanceof HttpError) return sendJson(res, error.status, { error: error.code, message: error.message, ...error.extra }, req.url.startsWith('/lab/') ? { 'access-control-allow-origin': '*' } : {});
      if (error instanceof StoreError) return sendJson(res, STORE_ERROR_STATUS[error.code] ?? 500, { error: error.code, message: error.message, currentRev: error.currentRev, updatedAt: error.updatedAt });
      if (!config.quiet) console.error('[server] unexpected error:', error);
      return sendJson(res, 500, { error: 'internal', message: 'Unexpected server error.' });
    });
  };

  return { handler, store, config, state, api };
}

/** Start listening on both loopback families (`*.localhost` resolves to ::1 first on macOS). */
export async function startServer(overrides = {}) {
  const app = await createApp(overrides);
  const servers = [];
  const listen = (host, port) => new Promise((resolve, reject) => {
    const server = http.createServer(app.handler);
    server.once('error', reject);
    server.listen(port, host, () => { server.removeListener('error', reject); resolve(server); });
  });
  let first;
  try {
    first = await listen('127.0.0.1', app.config.port);
  } catch (error) {
    if (error.code === 'EADDRINUSE') throw new Error(`Port ${app.config.port} is already in use. Stop the other process or choose another port: JSLL_PORT=7310 npm start`);
    throw error;
  }
  app.state.port = first.address().port;
  servers.push(first);
  try {
    servers.push(await listen('::1', app.state.port));
  } catch {
    /* IPv6 loopback unavailable: 127.0.0.1 and localhost still work */
  }
  const close = () => Promise.all(servers.map((s) => new Promise((r) => { s.closeAllConnections?.(); s.close(r); })));
  return { ...app, port: app.state.port, close, url: `http://${APP_HOSTNAME}:${app.state.port}/`, fallbackUrl: `http://${APP_FALLBACK_HOSTNAME}:${app.state.port}/` };
}
