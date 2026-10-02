// Lab fixture API: real loopback HTTP endpoints for network lessons (JS-08, JS-16, RE-06, RN-06…).
// Synthetic in-memory data only; state resets when the server restarts or on POST …/reset.
// Documented for content authors in content/README.md ("Lab API").
//
// The lab needs no token and answers with `access-control-allow-origin: *` (CORS lessons), so any
// web page open in the browser can send it simple requests. Its memory is therefore bounded:
// at most LIMITS.collections collections, LIMITS.storedBytes of records written through the API
// (`507 lab-full` beyond that, until POST /lab/reset) and LIMITS.counters retry counters (oldest
// dropped first). Anything stored here is readable by every web page: never personal data.
import { HttpError, readJson, sendJson } from './http-util.mjs';

const MAX_DELAY_MS = 10_000;
export const LAB_LIMITS = Object.freeze({ collections: 64, storedBytes: 8 * 1024 * 1024, counters: 1000 });
const CORS_OPEN = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'x-lab-attempt, x-total-count, location' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const labFull = (what) => new HttpError(507, 'lab-full', `The lab keeps ${what} in memory. POST /lab/reset clears it.`);

export function createLab({ domains = null, limits = LAB_LIMITS } = {}) {
  const collections = new Map(); // `${ns}:${lang}` → Map(id → record)
  const recordBytes = new Map(); // `${ns}:${lang}` → Map(id → bytes of records written through the API)
  const counters = new Map(); // key → attempts
  let storedBytes = 0;
  let nextId = 1;

  const bump = (key) => {
    if (!counters.has(key) && counters.size >= limits.counters) counters.delete(counters.keys().next().value);
    const attempt = (counters.get(key) ?? 0) + 1;
    counters.set(key, attempt);
    return attempt;
  };
  const putRecord = (key, items, id, record) => {
    const sizes = recordBytes.get(key);
    const bytes = Buffer.byteLength(JSON.stringify(record));
    const delta = bytes - (sizes.get(id) ?? 0);
    if (delta > 0 && storedBytes + delta > limits.storedBytes) throw labFull(`at most ${limits.storedBytes} bytes of records`);
    storedBytes += delta;
    sizes.set(id, bytes);
    items.set(id, record);
  };
  const deleteRecord = (key, items, id) => {
    const sizes = recordBytes.get(key);
    storedBytes -= sizes.get(id) ?? 0;
    sizes.delete(id);
    items.delete(id);
  };
  const dropCollection = (key) => {
    for (const bytes of recordBytes.get(key)?.values() ?? []) storedBytes -= bytes;
    recordBytes.delete(key);
    collections.delete(key);
  };

  const seedFor = (ns, lang) => {
    const cap = domains?.capstones?.[ns];
    if (!cap) return [];
    const localize = (v) => (v && typeof v === 'object' && !Array.isArray(v) && ('uk' in v || 'en' in v) ? v[lang] ?? v.uk : v);
    return cap.fixtures.map((f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, localize(v)])));
  };
  const collectionKey = (ns, lang = 'uk') => {
    const key = `${ns}:${lang}`;
    if (!collections.has(key)) {
      if (collections.size >= limits.collections) throw labFull(`at most ${limits.collections} collections`);
      collections.set(key, new Map(seedFor(ns, lang).map((r) => [String(r.id), r])));
      recordBytes.set(key, new Map());
    }
    return key;
  };
  const collection = (ns, lang = 'uk') => collections.get(collectionKey(ns, lang));

  async function applyControls(url, res, extraHeaders) {
    const delay = Math.min(Number(url.searchParams.get('delay') ?? 0) || 0, MAX_DELAY_MS);
    if (delay > 0) await sleep(delay);
    const flaky = Number(url.searchParams.get('flaky') ?? 0);
    if (flaky > 0) {
      const attempt = bump(`flaky:${url.pathname}:${url.searchParams.get('key') ?? ''}`);
      extraHeaders['x-lab-attempt'] = String(attempt);
      if (attempt <= flaky) {
        sendJson(res, Number(url.searchParams.get('status') ?? 503), { error: 'temporary failure', attempt }, extraHeaders);
        return true;
      }
    } else if (url.searchParams.has('status')) {
      const status = Number(url.searchParams.get('status'));
      if (status >= 200 && status <= 599) {
        sendJson(res, status, { status, message: status >= 400 ? 'forced error' : 'forced status' }, extraHeaders);
        return true;
      }
    }
    return false;
  }

  /** @returns {Promise<boolean>} true when the request was handled */
  async function handleLab(req, res, url) {
    const parts = url.pathname.split('/').filter(Boolean).slice(1); // after "lab"
    const method = req.method;
    const headers = { ...CORS_OPEN };

    // --- CORS teaching endpoints (deliberately different header sets) ---
    if (parts[0] === 'cors') {
      const kind = parts[1];
      const origin = req.headers.origin ?? 'null';
      if (kind === 'open') return sendJson(res, 200, { cors: 'open', origin }, CORS_OPEN), true;
      if (kind === 'closed') return sendJson(res, 200, { cors: 'closed', note: 'The response exists, but without Access-Control-Allow-Origin the browser hides it from the page.' }), true;
      if (kind === 'preflight') {
        const allow = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '5' };
        if (method === 'OPTIONS') return res.writeHead(204, allow).end(), true;
        return sendJson(res, 200, { cors: 'preflight', method, contentType: req.headers['content-type'] ?? null }, allow), true;
      }
      if (kind === 'credentials') {
        const allow = { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', vary: 'Origin' };
        if (method === 'OPTIONS') return res.writeHead(204, { ...allow, 'access-control-allow-headers': 'content-type' }).end(), true;
        return sendJson(res, 200, { cors: 'credentials', origin, cookieHeaderReceived: Boolean(req.headers.cookie) }, allow), true;
      }
      throw new HttpError(404, 'not-found', 'Unknown CORS fixture.');
    }

    if (method === 'OPTIONS') {
      res.writeHead(204, { ...CORS_OPEN, 'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS', 'access-control-allow-headers': req.headers['access-control-request-headers'] ?? 'content-type', 'access-control-max-age': '60' }).end();
      return true;
    }

    if (parts[0] === 'ping') return sendJson(res, 200, { ok: true, time: new Date().toISOString() }, headers), true;

    if (parts[0] === 'reset' && method === 'POST') {
      collections.clear();
      recordBytes.clear();
      storedBytes = 0;
      counters.clear();
      return sendJson(res, 200, { ok: true }, headers), true;
    }

    if (parts[0] === 'echo') {
      const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readJson(req, 256 * 1024).catch(() => null) : null;
      if (await applyControls(url, res, headers)) return true;
      const shown = Object.fromEntries(['content-type', 'accept', 'origin', 'authorization', 'x-lab-token'].filter((h) => req.headers[h] !== undefined).map((h) => [h, req.headers[h]]));
      return sendJson(res, 200, { method, path: url.pathname, query: Object.fromEntries(url.searchParams), headers: shown, body }, headers), true;
    }

    if (parts[0] === 'status' && parts[1]) {
      const delay = Math.min(Number(url.searchParams.get('delay') ?? 0) || 0, MAX_DELAY_MS);
      if (delay) await sleep(delay);
      const status = Number(parts[1]);
      if (!(status >= 200 && status <= 599)) throw new HttpError(400, 'bad-status', 'Status must be between 200 and 599.');
      if ([204, 304].includes(status)) return res.writeHead(status, headers).end(), true;
      return sendJson(res, status, { status, ok: status < 400 }, headers), true;
    }

    if (parts[0] === 'delay' && parts[1]) {
      const waited = Math.min(Number(parts[1]) || 0, MAX_DELAY_MS);
      await sleep(waited);
      return sendJson(res, 200, { ok: true, waited }, headers), true;
    }

    if (parts[0] === 'flaky') {
      const fail = Number(url.searchParams.get('fail') ?? 2);
      const attempt = bump(`flaky:${url.searchParams.get('key') ?? 'default'}`);
      headers['x-lab-attempt'] = String(attempt);
      if (attempt <= fail) return sendJson(res, Number(url.searchParams.get('status') ?? 503), { error: 'temporary failure', attempt }, headers), true;
      return sendJson(res, 200, { ok: true, attempt }, headers), true;
    }

    if (parts[0] === 'search') {
      // Shorter queries answer more slowly unless ?delay= is given: the classic stale-response race.
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const ns = url.searchParams.get('ns') ?? 'wishlist';
      const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'uk';
      const delay = url.searchParams.has('delay') ? Math.min(Number(url.searchParams.get('delay')) || 0, MAX_DELAY_MS) : Math.max(60, 600 - q.length * 150);
      await sleep(delay);
      const results = [...collection(ns, lang).values()].filter((r) => Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(q)));
      return sendJson(res, 200, { q, delay, results }, headers), true;
    }

    // --- collections: /lab/<ns>/items[/<id>] ---
    if (parts.length >= 2 && parts[1] === 'items') {
      const ns = parts[0];
      const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'uk';
      const key = collectionKey(ns, lang);
      const items = collections.get(key);
      let id = null;
      if (parts[2] !== undefined) {
        try {
          id = decodeURIComponent(parts[2]);
        } catch {
          throw new HttpError(400, 'bad-id', 'The item id in the address is not valid percent-encoding.');
        }
      }
      if (await applyControls(url, res, headers)) return true;
      if (id === null) {
        if (method === 'GET') {
          const q = (url.searchParams.get('q') ?? '').toLowerCase();
          let list = [...items.values()];
          if (q) list = list.filter((r) => Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(q)));
          const total = list.length;
          const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0) || 0);
          const limit = url.searchParams.has('limit') ? Math.max(0, Number(url.searchParams.get('limit')) || 0) : total;
          return sendJson(res, 200, { items: list.slice(offset, offset + limit), total }, { ...headers, 'x-total-count': String(total) }), true;
        }
        if (method === 'POST') {
          const body = await readJson(req, 256 * 1024);
          if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'bad-body', 'Send a JSON object.');
          const newId = body.id !== undefined && !items.has(String(body.id)) ? String(body.id) : `lab-${nextId++}`;
          const record = { ...body, id: newId };
          putRecord(key, items, newId, record);
          return sendJson(res, 201, record, { ...headers, location: `/lab/${ns}/items/${encodeURIComponent(newId)}` }), true;
        }
        throw new HttpError(405, 'method-not-allowed', 'Use GET or POST on a collection.');
      }
      if (!items.has(id)) throw new HttpError(404, 'not-found', `No item with id "${id}".`);
      if (method === 'GET') return sendJson(res, 200, items.get(id), headers), true;
      if (method === 'PUT' || method === 'PATCH') {
        const body = await readJson(req, 256 * 1024);
        if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'bad-body', 'Send a JSON object.');
        const record = method === 'PUT' ? { ...body, id } : { ...items.get(id), ...body, id };
        putRecord(key, items, id, record);
        return sendJson(res, 200, record, headers), true;
      }
      if (method === 'DELETE') {
        deleteRecord(key, items, id);
        return res.writeHead(204, headers).end(), true;
      }
      throw new HttpError(405, 'method-not-allowed', 'Use GET, PUT, PATCH or DELETE on an item.');
    }

    if (parts.length === 2 && parts[1] === 'reset' && method === 'POST') {
      for (const key of [...collections.keys()]) if (key.startsWith(`${parts[0]}:`)) dropCollection(key);
      return sendJson(res, 200, { ok: true }, headers), true;
    }

    return false;
  }
  /** Current memory use, for tests and diagnostics. */
  handleLab.stats = () => ({ collections: collections.size, storedBytes, counters: counters.size });
  return handleLab;
}
