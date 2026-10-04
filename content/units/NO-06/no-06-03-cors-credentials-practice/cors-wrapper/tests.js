// The CORS wrapper around the planner handler, over real HTTP with explicit Origin headers.
import http from 'node:http';
import { plannerHandler } from './app.js';
import { cors } from './cors.js';

const DEV = 'http://127.0.0.1:5173';
const OTHER = 'http://127.0.0.1:8080';
const preflightHeaders = (origin) => ({ origin, 'access-control-request-method': 'PATCH', 'access-control-request-headers': 'content-type' });

async function start({ allowCredentials = false, handler = plannerHandler } = {}) {
  expect(typeof cors, 'type of cors').toBe('function');
  const wrapped = cors({ allowedOrigins: [DEV], allowCredentials })(handler);
  return listen(http.createServer(wrapped));
}
const get = (base, origin) => request(`${base}/v1/records`, { headers: origin ? { origin } : {} });
const preflight = (base, origin) => request(`${base}/v1/records`, { method: 'OPTIONS', headers: preflightHeaders(origin) });

test('an allowlisted origin is echoed, never *', async () => {
  const response = await get(await start(), DEV);
  expect(response.status, 'status of GET from the dev origin').toBe(200);
  expect(response.headers['access-control-allow-origin'], 'Access-Control-Allow-Origin').toBe(DEV);
});

test('every answer carries Vary: Origin', async () => {
  const base = await start();
  expect(String((await get(base, DEV)).headers.vary), 'Vary for the dev origin').toMatch(/origin/i);
  expect(String((await get(base, OTHER)).headers.vary), 'Vary for another origin').toMatch(/origin/i);
});

test('an origin outside the list gets no Access-Control-Allow-Origin, and the handler still answers', async () => {
  const base = await start();
  const other = await get(base, OTHER);
  expect(other.status, 'status of GET from another origin').toBe(200);
  expect(other.headers['access-control-allow-origin'], 'Access-Control-Allow-Origin for another origin').toBeUndefined();
  expect((await get(base)).headers['access-control-allow-origin'], 'Access-Control-Allow-Origin without Origin').toBeUndefined();
});

test('a preflight from the dev origin answers 204 itself, with methods and headers', async () => {
  let handlerCalls = 0;
  const base = await start({ handler: (request, response) => { handlerCalls += 1; plannerHandler(request, response); } });
  const response = await preflight(base, DEV);
  expect(response.status, 'status of the preflight').toBe(204);
  expect(handlerCalls, 'calls of the planner handler').toBe(0);
  expect(response.headers['access-control-allow-origin'], 'Access-Control-Allow-Origin').toBe(DEV);
  expect(String(response.headers['access-control-allow-methods']), 'Access-Control-Allow-Methods').toContain('PATCH');
  expect(String(response.headers['access-control-allow-headers']).toLowerCase(), 'Access-Control-Allow-Headers').toContain('content-type');
});

test('a preflight from another origin gets no permission', async () => {
  const response = await preflight(await start(), OTHER);
  expect(response.headers['access-control-allow-origin'], 'Access-Control-Allow-Origin').toBeUndefined();
  expect(response.headers['access-control-allow-methods'], 'Access-Control-Allow-Methods').toBeUndefined();
});

test('Access-Control-Allow-Credentials: true appears only with allowCredentials', async () => {
  const withCredentials = await start({ allowCredentials: true });
  expect((await get(withCredentials, DEV)).headers['access-control-allow-credentials'], 'on GET with allowCredentials').toBe('true');
  expect((await preflight(withCredentials, DEV)).headers['access-control-allow-credentials'], 'on the preflight with allowCredentials').toBe('true');
  expect((await get(withCredentials, OTHER)).headers['access-control-allow-credentials'], 'for another origin').toBeUndefined();
  const without = await start({ allowCredentials: false });
  expect((await get(without, DEV)).headers['access-control-allow-credentials'], 'without allowCredentials').toBeUndefined();
});
