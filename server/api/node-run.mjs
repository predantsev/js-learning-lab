// Isolated real-Node execution API (Node-stage practice). See docs/platform/SERVER-API.md.
//   POST /api/node/run   → application/x-ndjson stream of run events
//   POST /api/node/stop  { runId } → { stopped }
import { HttpError, readJson } from '../http-util.mjs';
import { createNodeRunner, validateRunRequest } from './lib/node-runner.mjs';

export async function register(api) {
  // JSLL_NODE_OS_SANDBOX=off turns the macOS Seatbelt layer off (troubleshooting; the permission
  // model and the platform guard stay on).
  const runner = await createNodeRunner({ runtimeDir: api.config.runtimeDir, osSandbox: process.env.JSLL_NODE_OS_SANDBOX === 'off' ? false : 'auto' });
  api.features.isolatedNode = runner.feature;
  api.nodeRunner = runner;

  api.route('POST', '/api/node/run', async ({ req, res }) => {
    if (!runner.feature.available) throw new HttpError(501, 'isolation-unavailable', runner.feature.reason, { feature: runner.feature });
    const spec = validateRunRequest(await readJson(req));
    let streaming = false;
    let runId = null;
    const emit = (event) => {
      if (!streaming) {
        streaming = true;
        res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-accel-buffering': 'no' });
        res.socket?.setNoDelay(true);
        // A dropped connection stops the run.
        res.on('close', () => {
          if (!res.writableEnded && runId) runner.stop(runId, 'disconnected');
        });
      }
      if (event.type === 'start') runId = event.runId;
      if (!res.writableEnded && !res.destroyed) res.write(`${JSON.stringify(event)}\n`);
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
