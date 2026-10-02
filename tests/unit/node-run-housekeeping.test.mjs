// Node runner housekeeping: a client that goes away before the "start" event does not leave its
// run going until the time limit, and scratch folders left by a crashed server are removed when
// the next server starts (folders of a live server sharing the runtime folder are kept).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { sweepScratch } from '../../server/api/lib/scratch.mjs';
import { startTestServer, waitUntil } from './helpers.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('a client that disconnects before the start event leaves no run behind, and Node is never started', async () => {
  const ctx = await startTestServer();
  try {
    const runner = ctx.server.api.nodeRunner;
    assert.equal(runner.feature.available, true, runner.feature.reason);
    // Hold the run before its "start" event long enough for the client to go away first.
    const original = runner.start;
    const events = [];
    let calls = 0;
    runner.start = async (spec, emit) => {
      await sleep(300);
      calls += 1;
      return original(spec, (event) => { events.push(event); emit(event); });
    };
    const controller = new AbortController();
    const request = fetch(`${ctx.base}/api/node/run`, {
      method: 'POST',
      headers: ctx.headers,
      body: JSON.stringify({ entry: 'index.js', files: { 'index.js': 'console.log("started"); setInterval(() => {}, 1000);' }, timeoutMs: 20000 }),
      signal: controller.signal,
    }).catch((error) => error);
    await sleep(80);
    controller.abort();
    assert.equal((await request).name, 'AbortError');
    assert.ok(await waitUntil(() => calls === 1, { timeout: 3000 }), 'the run was started on the server after the client left');
    assert.ok(await waitUntil(() => runner.runs.size === 0, { timeout: 3000 }), 'the run ends right away instead of at its 20 s time limit');
    const exit = events.find((e) => e.type === 'exit');
    assert.equal(exit?.reason, 'disconnected');
    assert.equal(events.some((e) => e.type === 'stdout'), false, 'the program never ran');
    const start = events.find((e) => e.type === 'start');
    // The run leaves the active list first, then its folder is deleted.
    assert.ok(await waitUntil(() => !existsSync(start.cwd), { timeout: 3000 }), 'the workspace is removed');
    runner.start = original;
  } finally {
    await ctx.close();
  }
});

/** The id of a process that has just exited (not alive any more). */
async function deadPid() {
  const child = spawn(process.execPath, ['-e', ''], { stdio: 'ignore' });
  await new Promise((resolve) => child.on('exit', resolve));
  return child.pid;
}

test('starting a server removes scratch folders of crashed servers and keeps those of live ones', async () => {
  const tmp = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-unit-sweep-')));
  const live = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { stdio: 'ignore' });
  try {
    const dead = await deadPid();
    const runtimeDir = path.join(tmp, 'runtime');
    const names = {
      crashed: `${dead}-nr-crashed`,
      legacy: 'nr-legacy-without-owner',
      otherServer: `${live.pid}-nr-other-server`,
      thisProcess: `${process.pid}-nr-this-process`,
    };
    for (const root of ['node-runs', 'typecheck']) {
      for (const name of Object.values(names)) {
        await fs.mkdir(path.join(runtimeDir, root, name, 'nested'), { recursive: true });
        await fs.writeFile(path.join(runtimeDir, root, name, 'nested', 'index.js'), 'console.log("learner code");');
      }
    }
    const ctx = await startTestServer({ runtimeDir });
    try {
      for (const root of ['node-runs', 'typecheck']) {
        const left = (await fs.readdir(path.join(runtimeDir, root))).sort();
        assert.ok(!left.includes(names.crashed), `${root}: the folder of a crashed server is removed`);
        assert.ok(!left.includes(names.legacy), `${root}: an unprefixed folder of an older version is removed`);
        assert.ok(left.includes(names.otherServer), `${root}: the folder of another live server is kept`);
        assert.ok(left.includes(names.thisProcess), `${root}: a folder of this process is kept`);
      }
      // A new run still works, and its workspace carries this server's process id.
      const response = await fetch(`${ctx.base}/api/node/run`, { method: 'POST', headers: ctx.headers, body: JSON.stringify({ entry: 'index.js', files: { 'index.js': 'console.log(process.cwd())' } }) });
      const start = JSON.parse((await response.text()).split('\n')[0]);
      assert.equal(path.basename(start.cwd), `${process.pid}-${start.runId}`);
    } finally {
      await ctx.close();
    }
  } finally {
    live.kill();
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('sweepScratch tolerates a missing folder', async () => {
  assert.deepEqual(await sweepScratch(path.join(os.tmpdir(), 'jsll-does-not-exist', String(Date.now()))), []);
});
