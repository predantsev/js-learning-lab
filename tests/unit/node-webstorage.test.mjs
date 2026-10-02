// Loading the source transform (and with it @babel/standalone) in Node must not touch Node's
// `localStorage` global: on Node 25 that prints "--localstorage-file was provided without a valid
// path" on every build and `npm start`. Other warnings must still be printed.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const transformUrl = pathToFileURL(path.join(ROOT, 'shared', 'transform.js')).href;
const node = (source) => spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' } });

const describe = 'const d = Object.getOwnPropertyDescriptor(globalThis, "localStorage"); return d ? (typeof d.get === "function" ? "getter" : "value") : "absent";';
const nodeHasWebStorageGetter = node(`console.log((() => { ${describe} })());`).stdout.trim() === 'getter';

test('importing the transform in Node prints no localStorage warning and keeps other warnings and the global', { skip: nodeHasWebStorageGetter ? false : `this Node (${process.version}) has no localStorage getter to trigger` }, () => {
  const r = node(`
    const { transformScript } = await import(${JSON.stringify(transformUrl)});
    const out = transformScript('index.js', 'const a = 1; console.log(a);');
    console.log('transformed', typeof out.code);
    console.log('localStorage after load:', (() => { ${describe} })());
    process.emitWarning('jsll probe warning');
  `);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /transformed string/);
  assert.match(r.stdout, /localStorage after load: getter/, 'the original global is restored after Babel loads');
  assert.doesNotMatch(r.stderr, /localstorage-file/, 'no warning about the localStorage file');
  assert.match(r.stderr, /Warning: jsll probe warning/, 'other warnings are still printed');
});
