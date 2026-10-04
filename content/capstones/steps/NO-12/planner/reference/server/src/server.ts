// The records server: `npm start` (or `node src/server.ts`) in server/ starts it on the host and the port
// from loadConfig (127.0.0.1 and 4311 by default; HOST and PORT change them); Ctrl+C stops it cleanly. Everything under /v1 is
// the records API of src/api.ts. The unversioned GET /records of the first endpoint stays as it was
// published: the stored tasks as JSON; another method on /records is a JSON 405 with Allow, and any
// other address a JSON 404. Every answer goes through sendJson and carries the CORS headers of src/cors.ts:
// the web app's origin may read it, and its preflights are answered before any route. For running it as a
// service: GET /livez (the process answers), GET /readyz (it can serve: the store reads and no shutdown has
// begun — 503 otherwise), GET /metrics (src/metrics.ts), and a graceful shutdown on SIGTERM and SIGINT: stop
// taking connections, let the requests in flight finish, then exit 0 — or cut them and exit 1 when the
// deadline (SHUTDOWN_DEADLINE_MS) passes first. createRecordsServer only builds the server, so the checks
// can start it themselves; the part at the bottom runs only when this file is started with node.
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { API_MAX_BODY_BYTES, handleV1 } from "./api.ts";
import { DEFAULT_ALLOWED_ORIGINS, hostWarning, loadConfig } from "./config.ts";
import { answerPreflight, applyCors } from "./cors.ts";
import type { TaskRepository } from "./fileRepository.ts";
import { createIdempotencyStore } from "./idempotency.ts";
import type { ImportLimits } from "./importer.ts";
import { createJobQueue } from "./jobs.ts";
import { errorLine, levelFor, requestIdOf, writeJsonLine } from "./log.ts";
import { createMetrics, routeLabel } from "./metrics.ts";
import type { Metrics } from "./metrics.ts";
import type { Log } from "./log.ts";
import { initStore } from "./open.ts";
import type { Opened } from "./open.ts";

// Sends `value` as a complete JSON answer: the status, Content-Type and Content-Length in bytes (a
// Ukrainian letter takes two), then the body.
export function sendJson(res: http.ServerResponse, status: number, value: unknown): void {
  const text = JSON.stringify(value);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(text));
  res.end(text);
}

// The limits at the edge. The server's own timeouts work before any handler runs, so only they see a
// client that sends its headers or its body too slowly: 408 Request Timeout. Node checks them once every
// connectionsCheckingInterval.
export type Limits = { maxBodyBytes: number; headersTimeoutMs: number; requestTimeoutMs: number; checkIntervalMs: number };

export const LIMITS: Limits = { maxBodyBytes: API_MAX_BODY_BYTES, headersTimeoutMs: 10_000, requestTimeoutMs: 30_000, checkIntervalMs: 1_000 };

// A server that is not listening yet. `log` gets one JSON line per finished request (and one per failure
// inside); the tests pass their own function and their own, shorter limits. `allowedOrigins` is the CORS
// allowlist (loadConfig's, the web app's origin by default). `ops` holds the metrics and the shutdown flag
// that start() turns on; the tests pass their own.
export type Ops = { metrics: Metrics; health: { shuttingDown: boolean } };

export function createRecordsServer(repository: TaskRepository, log: Log = writeJsonLine, limits: Partial<Limits> = {}, importLimits: Partial<ImportLimits> = {}, allowedOrigins: readonly string[] = DEFAULT_ALLOWED_ORIGINS, ops: Partial<Ops> = {}): http.Server {
  const metrics = ops.metrics ?? createMetrics();
  const health = ops.health ?? { shuttingDown: false };
  const { maxBodyBytes, headersTimeoutMs, requestTimeoutMs, checkIntervalMs } = { ...LIMITS, ...limits };
  // One store per server: the keys live as long as the process.
  const idempotency = createIdempotencyStore();
  // One import at a time and none waiting: a second one gets 503 at once instead of eating memory.
  const imports = createJobQueue({ concurrency: 1, maxQueued: 0 });
  const options = { headersTimeout: headersTimeoutMs, requestTimeout: requestTimeoutMs, connectionsCheckingInterval: checkIntervalMs };
  const server = http.createServer(options, async (req, res) => {
    // The id and the log line come first, so every answer — a refusal too — has both.
    const requestId = requestIdOf(req);
    const started = performance.now();
    res.setHeader("x-request-id", requestId);
    res.on("finish", () => {
      const route = URL.canParse(req.url ?? "", "http://localhost") ? new URL(req.url ?? "", "http://localhost").pathname : "(unparsable)";
      const ms = performance.now() - started;
      log({ time: new Date().toISOString(), level: levelFor(res.statusCode), requestId: requestId, method: req.method ?? "", route: route, status: res.statusCode, durationMs: Math.round(ms) });
      metrics.record(routeLabel(route), res.statusCode, ms);
      // A request that was already in flight when the shutdown began kept its keep-alive connection: once
      // it is answered that connection is idle, and close() would wait for it until the deadline.
      if (health.shuttingDown) {
        setImmediate(() => server.closeIdleConnections());
      }
    });
    // During a shutdown every answer closes its connection, so no keep-alive connection holds close() up.
    if (health.shuttingDown) {
      res.setHeader("connection", "close");
    }
    if (answerPreflight(req, res, allowedOrigins)) {
      return;
    }
    applyCors(req, res, allowedOrigins);
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const { pathname } = url;
      if (pathname === "/livez" || pathname === "/readyz" || pathname === "/metrics") {
        if (req.method !== "GET") {
          res.setHeader("allow", "GET");
          return sendJson(res, 405, { error: "method not allowed" });
        }
        if (pathname === "/livez") {
          return sendJson(res, 200, { status: "alive" });
        }
        if (pathname === "/readyz") {
          if (health.shuttingDown) {
            return sendJson(res, 503, { status: "shutting down" });
          }
          // Ready means the store can be read: a store that was removed or damaged after the start is a 503.
          const readable = await repository.list().then(() => true, () => false);
          return sendJson(res, readable ? 200 : 503, { status: readable ? "ready" : "not ready" });
        }
        res.statusCode = 200;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        return res.end(metrics.render());
      }
      if (pathname === "/v1" || pathname.startsWith("/v1/")) {
        return await handleV1(req, res, { url: url, requestId: requestId, repository: repository, idempotency: idempotency, maxBodyBytes: maxBodyBytes, log: log, imports: imports, importLimits: importLimits, sendJson: sendJson });
      }
      if (pathname !== "/records") {
        return sendJson(res, 404, { error: "not found" });
      }
      if (req.method !== "GET") {
        res.setHeader("allow", "GET");
        return sendJson(res, 405, { error: "method not allowed" });
      }
      sendJson(res, 200, await repository.list());
    } catch (error) {
      // The name of the error goes to the log, never its message or stack — and nothing goes to the client.
      log(errorLine(requestId, error));
      if (res.headersSent) {
        res.end();
      } else {
        sendJson(res, 500, { error: "internal error" });
      }
    }
  });
  return server;
}

// Starts the store and then the server; a store that cannot be opened safely stops the start (exit code 1).
async function start(): Promise<void> {
  const config = loadConfig(process.env);
  if (!config.ok) {
    for (const message of config.errors) {
      console.error(message);
    }
    process.exitCode = 1;
    return;
  }
  let opened: Opened;
  try {
    opened = await initStore(config.value);
  } catch (error) {
    console.error(`Cannot start: ${(error as Error).message}`);
    process.exitCode = 1;
    return;
  }
  const { repository, removedTemps, recovery, seeded } = opened;
  for (const name of removedTemps) {
    console.log(`Removed a temp file left by a crash: ${name}`);
  }
  if (recovery.action === "restored") {
    console.log(`The store was damaged: moved aside as ${recovery.quarantined}, restored ${recovery.count} tasks from ${recovery.restoredFrom}`);
    console.log(`Not in the backup: ${recovery.notInBackup === null ? "unknown (the damaged file is not JSON)" : recovery.notInBackup.join(", ") || "none"}`);
  }
  if (seeded) {
    console.log(`Created the data file with the starting tasks: ${repository.file}`);
  }
  // listen() only after the store is ready.
  const { host, port } = config.value;
  const warning = hostWarning(host);
  if (warning !== null) {
    console.warn(JSON.stringify({ time: new Date().toISOString(), level: "warn", event: "host", host: host, message: warning }));
  }
  const ops: Ops = { metrics: createMetrics(), health: { shuttingDown: false } };
  const server = createRecordsServer(repository, writeJsonLine, {}, {}, config.value.allowedOrigins, ops);
  const { name, version } = JSON.parse(await readFile(path.join(import.meta.dirname, "..", "package.json"), "utf8")) as { name: string; version: string };
  server.listen(port, host, () => {
    console.log(`${name} ${version} (pid ${process.pid}, NODE_ENV=${config.value.nodeEnv}) listening on http://${host.includes(":") ? `[${host}]` : host}:${port}`);
    console.log("Stop it with Ctrl+C (SIGINT) or SIGTERM.");
  });

  // One shutdown, whichever signal comes first: /readyz says 503 at once, no new connection is accepted,
  // the requests in flight finish (every answer closes its connection), then exit 0. If they have not
  // finished by the deadline, the connections are cut and the exit code is 1 — a manager that kills with
  // SIGKILL after its own deadline would leave no trace, so the server exits before it.
  const shutdown = (signal: string) => {
    if (ops.health.shuttingDown) {
      return;
    }
    ops.health.shuttingDown = true;
    const deadline = config.value.shutdownDeadlineMs;
    console.log(`${signal} received: closing the server, waiting at most ${deadline} ms for the requests in flight…`);
    const timer = setTimeout(() => {
      console.error(`The deadline of ${deadline} ms passed: cutting the remaining connections.`);
      server.closeAllConnections();
      process.exit(1);
    }, deadline);
    server.close(() => {
      clearTimeout(timer);
      console.log("Server closed. Bye.");
      process.exitCode = 0;
    });
    server.closeIdleConnections();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// Runs only with `node src/server.ts` (npm start), not when another module imports this file.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await start();
}
