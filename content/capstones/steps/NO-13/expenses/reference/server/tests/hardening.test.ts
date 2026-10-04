// Tests of the edge of the records server over real HTTP: body limits (with and without Content-Length),
// the server's timeouts, malformed bodies, prototype keys, the query allowlist, ids from the path, the
// JSON log lines and the request id, and the loopback default. Requests a fetch cannot send — a chunked
// body that never ends, headers that arrive one letter at a time — go through a raw socket (node:net).
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import net from "node:net";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { hostWarning, loadConfig } from "../src/config.ts";
import { createFileRepository } from "../src/fileRepository.ts";
import type { ExpenseRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import type { LogLine, RequestLine } from "../src/log.ts";
import { createRecordsServer } from "../src/server.ts";
import type { Limits } from "../src/server.ts";

async function freshRepository(): Promise<ExpenseRepository> {
  const repository = createFileRepository(path.join(import.meta.dirname, "..", ".check", "hardening", randomUUID()));
  await repository.seed(await loadFixtures());
  return repository;
}

type Started = { base: string; port: number; lines: LogLine[]; repository: ExpenseRepository };

async function startServer(t: TestContext, limits: Partial<Limits> = {}, repository?: ExpenseRepository): Promise<Started> {
  const store = repository ?? (await freshRepository());
  const lines: LogLine[] = [];
  const server = createRecordsServer(store, (line) => lines.push(line), limits);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const { port } = server.address() as AddressInfo;
  return { base: `http://127.0.0.1:${port}`, port: port, lines: lines, repository: store };
}

async function send(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init.headers }, signal: AbortSignal.timeout(2000) });
  const text = await response.text();
  return { status: response.status, headers: response.headers, json: text === "" ? undefined : JSON.parse(text) };
}

// The log line of a request is written when its answer has finished; wait a moment for it.
async function lineOf(lines: LogLine[], requestId: string): Promise<LogLine> {
  for (let i = 0; i < 50; i++) {
    const line = lines.find((one) => one.requestId === requestId && !("event" in one));
    if (line !== undefined) {
      return line;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`no log line for ${requestId}`);
}

type Raw = { status: number | null; closed: boolean; text: string };

// Opens a raw connection, lets `write` send whatever it wants, and collects the answer until the server
// closes the connection or waitMs passes.
function raw(port: number, write: (socket: net.Socket) => void, waitMs = 2000): Promise<Raw> {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    let text = "";
    const done = (closed: boolean) => {
      clearTimeout(timer);
      socket.destroy();
      const match = /^HTTP\/1\.1 (\d{3})/.exec(text);
      resolve({ status: match ? Number(match[1]) : null, closed: closed, text: text });
    };
    const timer = setTimeout(() => done(false), waitMs);
    socket.on("data", (chunk) => (text += chunk));
    socket.on("close", () => done(true));
    socket.on("error", () => {});
    socket.on("connect", () => write(socket));
  });
}

test("a body over 4096 bytes without Content-Length (chunked) is 413 with Connection: close, and nothing is stored", async (t) => {
  const { port, repository } = await startServer(t);
  let timer: NodeJS.Timeout | undefined;
  const answer = await raw(port, (socket) => {
    socket.write("POST /v1/records HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n");
    let sent = 0;
    timer = setInterval(() => {
      if (socket.destroyed || sent > 64 * 1024) {
        clearInterval(timer);
        return;
      }
      socket.write(`200\r\n${"x".repeat(512)}\r\n`);
      sent += 512;
    }, 5);
  });
  clearInterval(timer);
  assert.equal(answer.status, 413);
  assert.match(answer.text, /connection: close/i);
  assert.equal(answer.closed, true);
  assert.equal((await repository.list()).length, 6);
});

test("a declared Content-Length over the limit is 413 at once, before the body arrives", async (t) => {
  const { port } = await startServer(t);
  const answer = await raw(port, (socket) => socket.write("POST /v1/records HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: 1000000\r\n\r\n"));
  assert.equal(answer.status, 413);
  assert.equal(answer.closed, true);
});

test("headers that arrive too slowly get 408 from the server's own timeout", async (t) => {
  const { port } = await startServer(t, { headersTimeoutMs: 300, requestTimeoutMs: 600, checkIntervalMs: 100 });
  let timer: NodeJS.Timeout | undefined;
  const answer = await raw(port, (socket) => {
    const head = "GET /v1/records HTTP/1.1\r\nHost: localhost\r\nX-Slow: " + "a".repeat(100);
    let index = 0;
    timer = setInterval(() => {
      if (!socket.destroyed && index < head.length) {
        socket.write(head[index++]);
      }
    }, 50);
  });
  clearInterval(timer);
  assert.equal(answer.status, 408);
});

test("malformed JSON and bytes that are not UTF-8 are 400 MALFORMED_JSON", async (t) => {
  const { base } = await startServer(t);
  assert.equal((await send(`${base}/v1/records`, { method: "POST", body: '{"label": ' })).json.error.code, "MALFORMED_JSON");
  const notUtf8 = await send(`${base}/v1/records`, { method: "POST", body: new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]) });
  assert.equal(notUtf8.status, 400);
  assert.equal(notUtf8.json.error.code, "MALFORMED_JSON");
});

test("__proto__ and constructor in a body are unknown fields, and no prototype changes", async (t) => {
  const { base, repository } = await startServer(t);
  const created = await send(`${base}/v1/records`, { method: "POST", body: '{"label":"%%fixture1Name%% 2","amountMinor":6500,"date":"2026-03-03","category":"food","__proto__":{"isAdmin":true},"constructor":{"prototype":{"isAdmin":true}}}' });
  assert.equal(created.status, 400);
  assert.deepEqual(created.json.error.details, JSON.parse('{"__proto__":"unknown-field","constructor":"unknown-field"}')); // JSON.parse: an own "__proto__" key
  const patched = await send(`${base}/v1/records/e-01`, { method: "PATCH", body: '{"__proto__":{"isAdmin":true}}' });
  assert.equal(patched.status, 400);
  assert.equal(({} as { isAdmin?: boolean }).isAdmin, undefined);
  assert.equal((await repository.list()).length, 6);
  assert.equal(Object.hasOwn((await repository.get("e-01"))!, "isAdmin"), false);
});

test("the list takes only known parameters, each once, and a limit of digits only", async (t) => {
  const { base } = await startServer(t);
  const cases: [string, Record<string, string>][] = [
    ["limit=1e1", { limit: "out-of-range" }],
    ["limit=", { limit: "out-of-range" }],
    ["limit=-1", { limit: "out-of-range" }],
    ["page=2", { page: "unknown-param" }],
    ["__proto__=x", JSON.parse('{"__proto__":"unknown-param"}')],
    ["sort=date&sort=amountMinor", { sort: "repeated" }],
    ["sort=constructor", { sort: "unknown-sort" }],
  ];
  for (const [query, details] of cases) {
    const answer = await send(`${base}/v1/records?${query}`);
    assert.equal(answer.status, 400, query);
    assert.deepEqual(answer.json.error.details, details, query);
  }
  assert.equal((await send(`${base}/v1/records?limit=07`)).status, 200);
});

test("an id that is not e-NN — ../, an escaped slash, a broken escape — is 400 before the store is read", async (t) => {
  const repository = await freshRepository();
  let reads = 0;
  const counted: ExpenseRepository = { ...repository, get: (id) => (reads++, repository.get(id)), update: (id, change) => (reads++, repository.update(id, change)), remove: (id) => (reads++, repository.remove(id)) };
  const { base } = await startServer(t, {}, counted);
  for (const id of ["..%2Fpackage.json", "..%2F..%2Fdata%2Fexpenses.json", "e-01%2F..", "%E0", "e-1", "E-01", "w-01"]) {
    const answer = await send(`${base}/v1/records/${id}`);
    assert.equal(answer.status, 400, id);
    assert.deepEqual(answer.json.error.details, { id: "malformed" }, id);
  }
  assert.equal(reads, 0);
  assert.equal((await send(`${base}/v1/records/e-99`)).status, 404);
});

// A valid expense; every case below breaks exactly one field of it.
const VALID = { label: "%%fixture1Name%% 2", amountMinor: 6500, date: "2026-03-03", category: "food" };

test("the edge refuses an 81-character label, an amountMinor that is not a positive whole number and a category outside the list", async (t) => {
  const { base, repository } = await startServer(t);
  const cases: [unknown, Record<string, string>][] = [
    [{ ...VALID, label: "x".repeat(81) }, { label: "too-long" }],
    [{ ...VALID, label: "   " }, { label: "required" }],
    [{ ...VALID, amountMinor: 0 }, { amountMinor: "not-positive-integer" }],
    [{ ...VALID, amountMinor: -100 }, { amountMinor: "not-positive-integer" }],
    [{ ...VALID, amountMinor: 12.5 }, { amountMinor: "not-positive-integer" }],
    [{ ...VALID, amountMinor: "6500" }, { amountMinor: "not-positive-integer" }],
    [{ ...VALID, category: "travel" }, { category: "unknown" }],
    [{ ...VALID, category: "Food" }, { category: "unknown" }],
    [{ ...VALID, category: "__proto__" }, { category: "unknown" }],
  ];
  for (const [body, details] of cases) {
    const answer = await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify(body) });
    assert.equal(answer.status, 400, JSON.stringify(body));
    assert.deepEqual(answer.json.error.details, details, JSON.stringify(body));
  }
  // The same rules hold for a replace and a merge.
  assert.deepEqual((await send(`${base}/v1/records/e-01`, { method: "PUT", body: JSON.stringify({ ...VALID, label: "y".repeat(81) }) })).json.error.details, { label: "too-long" });
  assert.deepEqual((await send(`${base}/v1/records/e-01`, { method: "PATCH", body: JSON.stringify({ category: "travel", amountMinor: 0.5 }) })).json.error.details, { amountMinor: "not-positive-integer", category: "unknown" });
  assert.equal((await repository.list()).length, 6);
  // The limits themselves pass: 80 characters (spaces at the edges are trimmed first) and one kopiyka.
  const edge = await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify({ ...VALID, label: ` ${"z".repeat(80)} `, amountMinor: 1, category: "fun" }) });
  assert.equal(edge.status, 201);
  assert.equal(edge.json.label, "z".repeat(80));
});

test("one JSON log line per request: request id, method, route without the query, status, duration — never a label or an amount", async (t) => {
  const { base, lines } = await startServer(t);
  const secretLabel = "%%fixture3Name%% SECRET-7781";
  const created = await send(`${base}/v1/records?trace=on`, { method: "POST", body: JSON.stringify({ ...VALID, label: secretLabel, amountMinor: 777777 }) });
  const listed = await send(`${base}/v1/records?sort=amountMinor&limit=2`);
  const read = await send(`${base}/v1/records/${created.json.id}`);
  const refused = await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify({ ...VALID, label: secretLabel, amountMinor: 888888, category: "travel" }) });
  for (const [answer, method, route, status, level] of [[created, "POST", "/v1/records", 201, "info"], [listed, "GET", "/v1/records", 200, "info"], [read, "GET", "/v1/records/e-07", 200, "info"], [refused, "POST", "/v1/records", 400, "warn"]] as const) {
    const line = (await lineOf(lines, answer.headers.get("x-request-id")!)) as RequestLine;
    assert.deepEqual(Object.keys(line).sort(), ["durationMs", "level", "method", "requestId", "route", "status", "time"]);
    assert.deepEqual({ method: line.method, route: line.route, status: line.status, level: line.level }, { method: method, route: route, status: status, level: level });
  }
  assert.equal(lines.length, 4);
  const logged = JSON.stringify(lines);
  assert.equal(logged.includes("SECRET-7781"), false);
  assert.equal(logged.includes("777777"), false);
  assert.equal(logged.includes("888888"), false);
  assert.equal(logged.includes("7777,77"), false); // nor as a formatted amount
  assert.equal(logged.includes("sort=amountMinor"), false);
});

test("a well-formed incoming X-Request-Id is kept; a malformed one is replaced by the server's own", async (t) => {
  const { base, lines } = await startServer(t);
  const kept = await send(`${base}/v1/records/e-01`, { headers: { "x-request-id": "client-abc-12345" } });
  assert.equal(kept.headers.get("x-request-id"), "client-abc-12345");
  assert.equal((await lineOf(lines, "client-abc-12345")).requestId, "client-abc-12345");
  for (const bad of ["short", "x".repeat(65), "a b c d e f g h", "<script>alert(1)</script>"]) {
    const answer = await send(`${base}/v1/records/e-99`, { headers: { "x-request-id": bad } });
    const id = answer.headers.get("x-request-id")!;
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, bad);
    assert.equal(answer.json.error.requestId, id);
  }
  assert.equal(JSON.stringify(lines).includes("<script>"), false);
});

test("a failure inside logs the error's name with the request id, never its message", async (t) => {
  const repository = await freshRepository();
  const broken: ExpenseRepository = { ...repository, list: async () => { throw new TypeError("disk on fire near %%fixture4Name%%"); } };
  const { base, lines } = await startServer(t, {}, broken);
  const answer = await send(`${base}/v1/records`);
  assert.equal(answer.status, 500);
  const requestId = answer.headers.get("x-request-id")!;
  assert.deepEqual(lines.find((line) => "event" in line), { time: lines.find((line) => "event" in line)!.time, level: "error", requestId: requestId, event: "failed", error: "TypeError", code: null });
  assert.equal((await lineOf(lines, requestId)).level, "error");
  assert.equal(JSON.stringify(lines).includes("disk on fire"), false);
});

test("the server listens on 127.0.0.1 unless HOST says otherwise, and warns about any address off loopback", () => {
  const plain = loadConfig({});
  assert.ok(plain.ok);
  assert.equal(plain.value.host, "127.0.0.1");
  for (const host of ["127.0.0.1", "::1", "localhost"]) {
    assert.equal(hostWarning(host), null, host);
  }
  for (const host of ["0.0.0.0", "::", "192.168.1.20"]) {
    assert.match(hostWarning(host) ?? "", /not on loopback/, host);
  }
  assert.equal(loadConfig({ HOST: " " }).ok, false);
});
