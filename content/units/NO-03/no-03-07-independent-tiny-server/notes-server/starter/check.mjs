// Read-only check script for your terminal. It sends real HTTP requests to a running notes server
// and prints a report. Start the server first (node notes.js), then in a second terminal:
//   node check.mjs                          (checks http://127.0.0.1:7330)
//   node check.mjs http://127.0.0.1:7331    (another address)
// It creates one note on the server; restart the server to get back to the three starting notes.
const base = process.argv[2] ?? 'http://127.0.0.1:7330';

async function send(method, path, body) {
  const response = await fetch(base + path, { method, body, signal: AbortSignal.timeout(2000) });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: response.status, type: response.headers.get('content-type') ?? '', allow: response.headers.get('allow') ?? '', json };
}

const checks = [
  ['GET /notes → 200, a JSON array', async () => {
    const r = await send('GET', '/notes');
    return r.status === 200 && Array.isArray(r.json) && r.type.startsWith('application/json');
  }],
  ['GET /notes/n-02 → 200, that note', async () => {
    const r = await send('GET', '/notes/n-02');
    return r.status === 200 && r.json?.id === 'n-02';
  }],
  ['GET /notes/n-99 → 404, JSON', async () => {
    const r = await send('GET', '/notes/n-99');
    return r.status === 404 && r.json !== undefined;
  }],
  ['POST /notes valid → 201, then listed', async () => {
    const r = await send('POST', '/notes', JSON.stringify({ text: 'check.mjs was here' }));
    const list = await send('GET', '/notes');
    return r.status === 201 && typeof r.json?.id === 'string' && list.json?.some((n) => n.id === r.json.id);
  }],
  ['POST /notes malformed JSON → 400', async () => (await send('POST', '/notes', '{"text": "cut')).status === 400],
  ['POST /notes without text → 400', async () => (await send('POST', '/notes', JSON.stringify({ title: 'x' }))).status === 400],
  ['POST /notes 8 KB body → 413', async () => (await send('POST', '/notes', JSON.stringify({ text: 'x'.repeat(8192) }))).status === 413],
  ['DELETE /notes → 405 with Allow', async () => {
    const r = await send('DELETE', '/notes');
    return r.status === 405 && r.allow.includes('GET');
  }],
  ['GET /nothing-here → 404', async () => (await send('GET', '/nothing-here')).status === 404],
];

let passed = 0;
console.log(`Checking ${base}`);
for (const [name, run] of checks) {
  let ok = false;
  let note = '';
  try {
    ok = await run();
  } catch (error) {
    note = ` (${error.name}: ${error.cause?.code ?? error.message})`;
  }
  if (ok) passed += 1;
  console.log(`${ok ? '✔' : '✖'} ${name}${note}`);
}
console.log(`${passed} of ${checks.length} checks passed`);
process.exitCode = passed === checks.length ? 0 : 1;
