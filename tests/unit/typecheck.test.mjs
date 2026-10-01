// Real TypeScript diagnostics through POST /api/typecheck (typescript@7 native compiler).
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { parseDiagnostics } from '../../server/api/typecheck.mjs';
import { api, startTestServer } from './helpers.mjs';

let ctx;
before(async () => {
  ctx = await startTestServer();
});
after(async () => {
  await ctx?.close();
});

test('the feature reports the compiler version', () => {
  const f = ctx.server.api.features.typecheck;
  assert.equal(f.available, true, f.reason);
  assert.match(f.tsVersion, /^\d+\.\d+\.\d+/);
});

test('type errors come back with file, line, column, code and message', async () => {
  const r = await api(ctx, 'POST', '/api/typecheck', {
    files: {
      'src/cart.ts': 'export type Item = { name: string; price: number };\nexport const total = (items: Item[]): number => items.reduce((s, i) => s + i.price, 0);\n',
      'src/main.ts': 'import { total, type Item } from "./cart.ts";\nconst items: Item[] = [{ name: "lamp" }];\nconst label: string = total(items);\nfunction greet(name) { return name; }\n',
    },
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.tsVersion, ctx.server.api.features.typecheck.tsVersion);
  const shown = r.json.diagnostics.map((d) => [d.file, d.line, d.column, d.code, d.category]);
  assert.deepEqual(shown, [
    ['src/main.ts', 2, 24, 2741, 'error'],
    ['src/main.ts', 3, 7, 2322, 'error'],
    ['src/main.ts', 4, 16, 7006, 'error'],
  ]);
  assert.match(r.json.diagnostics[0].message, /Property 'price' is missing/);
  assert.equal(typeof r.json.durationMs, 'number');
});

test('a clean project has no diagnostics; strict can be turned off', async () => {
  const clean = await api(ctx, 'POST', '/api/typecheck', { files: { 'a.ts': 'export const n: number = 1;\n' } });
  assert.deepEqual(clean.json.diagnostics, []);
  const loose = await api(ctx, 'POST', '/api/typecheck', { files: { 'a.ts': 'export function f(x) { return x; }\n' }, options: { strict: false } });
  assert.deepEqual(loose.json.diagnostics, []);
});

test('React components type-check against the installed React typings', async () => {
  const r = await api(ctx, 'POST', '/api/typecheck', {
    options: { jsx: true },
    files: { 'App.tsx': 'import { useState } from "react";\nexport function App({ start }: { start: number }) {\n  const [n, setN] = useState(start);\n  return <button onClick={() => setN(n + "1")}>{n}</button>;\n}\nexport const el = <App start="0" />;\n' },
  });
  assert.deepEqual(r.json.diagnostics.map((d) => [d.line, d.code]), [[4, 2345], [6, 2322]]);
});

test('unsafe paths, reserved names and bad options are rejected', async () => {
  assert.equal((await api(ctx, 'POST', '/api/typecheck', { files: { '../x.ts': '' } })).status, 400);
  assert.equal((await api(ctx, 'POST', '/api/typecheck', { files: { 'tsconfig.jsll.json': '{}' } })).status, 400);
  assert.equal((await api(ctx, 'POST', '/api/typecheck', { files: { 'a.ts': '' }, options: { lib: ['../../etc'] } })).status, 400);
  assert.equal((await api(ctx, 'POST', '/api/typecheck', { files: { 'a.ts': '' }, options: { strict: 'yes' } })).status, 400);
});

test('sending no TypeScript files is explained', async () => {
  const r = await api(ctx, 'POST', '/api/typecheck', { files: { 'notes.md': '# hi' } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.diagnostics.map((d) => [d.code, d.message]), [[18003, 'No TypeScript files to check (send .ts or .tsx files).']]);
});

test('parseDiagnostics handles chained messages and file-less errors', () => {
  const out = [
    "src/a.ts(3,7): error TS2322: Type '{ a: number; }' is not assignable to type 'B'.",
    "  Object literal may only specify known properties, and 'a' does not exist in type 'B'.",
    'error TS5023: Unknown compiler option \'bogus\'.',
    'tsconfig.json(1,2): warning TS6385: Something is deprecated.',
    '',
  ].join('\n');
  assert.deepEqual(parseDiagnostics(out), [
    { file: 'src/a.ts', line: 3, column: 7, code: 2322, category: 'error', message: "Type '{ a: number; }' is not assignable to type 'B'.\nObject literal may only specify known properties, and 'a' does not exist in type 'B'." },
    { file: null, line: null, column: null, code: 5023, category: 'error', message: "Unknown compiler option 'bogus'." },
    { file: 'tsconfig.json', line: 1, column: 2, code: 6385, category: 'warning', message: 'Something is deprecated.' },
  ]);
});
