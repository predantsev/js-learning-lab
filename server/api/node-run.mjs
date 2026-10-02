// Isolated real-Node execution API (Node-stage practice). See docs/platform/SERVER-API.md.
//   POST /api/node/run   → application/x-ndjson stream of run events
//   POST /api/node/stop  { runId } → { stopped }
import { HttpError, readJson } from '../http-util.mjs';
import { createNodeRunner, validateRunRequest } from './lib/node-runner.mjs';

export async function register(api) {
  // JSLL_NODE_OS_SANDBOX=off turns the macOS Seatbelt layer off (troubleshooting; the permission
  // model and the platform guard stay on). JSLL_NODE_RUNNER=off turns Node execution off entirely:
  // the feature reports "unavailable" and nothing runs. Code that starts the server can pass
  // createNodeRunner options as `overrides.nodeRunner` (tests use a `support` override to exercise
  // the real "no permission model" path).
  const runner = await createNodeRunner({
    runtimeDir: api.config.runtimeDir,
    osSandbox: process.env.JSLL_NODE_OS_SANDBOX === 'off' ? false : 'auto',
    // The platform's own port (known only after listen): runs must never reach it (guard.cjs).
    platformPorts: () => [api.state.port],
    ...(process.env.JSLL_NODE_RUNNER === 'off' ? { disabled: 'Isolated Node.js execution is turned off for this installation (JSLL_NODE_RUNNER=off).' } : {}),
    ...(api.overrides?.nodeRunner ?? {}),
  });
  api.features.isolatedNode = runner.feature;
  api.nodeRunner = runner;

  api.route('POST', '/api/node/run', async ({ req, res }) => {
    // A dropped connection stops the run. The listener is attached before anything else: a client
    // that goes away while the files are being written (before the "start" event) must not leave
    // the run going until its time limit.
    let runId = null;
    let disconnected = false;
    res.on('close', () => {
      if (res.writableEnded) return;
      disconnected = true;
      if (runId) runner.stop(runId, 'disconnected');
    });
    if (!runner.feature.available) throw new HttpError(501, 'isolation-unavailable', runner.feature.reason, { feature: runner.feature });
    const spec = validateRunRequest(await readJson(req));
    let streaming = false;
    const emit = (event) => {
      if (event.type === 'start') {
        runId = event.runId;
        if (disconnected) runner.stop(runId, 'disconnected'); // Node is not started at all
      }
      if (disconnected || res.writableEnded || res.destroyed) return;
      if (!streaming) {
        streaming = true;
        res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-accel-buffering': 'no' });
        res.socket?.setNoDelay(true);
      }
      res.write(`${JSON.stringify(event)}\n`);
    };
    await runner.start(spec, emit); // throws 429 / 501 before anything is streamed
    if (!res.writableEnded) res.end();
    return undefined;
  });

  api.route('POST', '/api/node/stop', async ({ req }) => {
    const body = await readJson(req, 16 * 1024);
    if (typeof body.runId !== 'string') throw new HttpError(400, 'bad-request', 'Send { "runId": "…" }.');
    return { stopped: runner.stop(body.runId) };
  });
}
