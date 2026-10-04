// Tests of the edge of the records server over real HTTP: body limits (with and without Content-Length),
// the server's timeouts, malformed bodies, prototype keys, the query allowlist, ids from the path, the
// habit rules (real days, the completions limit), the JSON log lines and the request id, and the loopback
// default. Requests a fetch cannot send — a chunked body that never ends, headers that arrive one letter
// at a time — go through a raw socket (node:net).
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import net from "node:net";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { hostWarning, loadConfig } from "../src/config.ts";
import { createFileRepository } from "../src/fileRepository.ts";
import type { HabitRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import type { LogLine, RequestLine } from "../src/log.ts";
import { createRecordsServer } from "../src/server.ts";
import type { Limits } from "../src/server.ts";
import { MAX_COMPLETIONS } from "../src/validate.ts";

async function freshRepository(): Promise<HabitRepository> {
  const repository = createFileRepository(path.join(import.meta.dirname, "..", ".check", "hardening", randomUUID()));
  await repository.seed(await loadFixtures());
  return repository;
}

type Started = { base: string; port: number; lines: LogLine[]; repository: HabitRepository };

async function startServer(t: TestContext, limits: Partial<Limits> = {}, repository?: HabitRepository): Promise<Started> {
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
  assert.equal((await send(`${base}/v1/records`, { method: "POST", body: '{"name": ' })).json.error.code, "MALFORMED_JSON");
  const notUtf8 = await send(`${base}/v1/records`, { method: "POST", body: new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]) });
  assert.equal(notUtf8.status, 400);
  assert.equal(notUtf8.json.error.code, "MALFORMED_JSON");
});

test("__proto__ and constructor in a body are unknown fields, and no prototype changes", async (t) => {
  const { base, repository } = await startServer(t);
  const created = await send(`${base}/v1/records`, { method: "POST", body: '{"name":"%%fixture1Name%% 2","frequency":"daily","__proto__":{"isAdmin":true},"constructor":{"prototype":{"isAdmin":true}}}' });
  assert.equal(created.status, 400);
  assert.deepEqual(created.json.error.details, JSON.parse('{"__proto__":"unknown-field","constructor":"unknown-field"}')); // JSON.parse: an own "__proto__" key
  const patched = await send(`${base}/v1/records/h-01`, { method: "PATCH", body: '{"__proto__":{"isAdmin":true}}' });
  assert.equal(patched.status, 400);
  assert.deepEqual(patched.json.error.details, JSON.parse('{"__proto__":"unknown-field"}'));
  const done = await send(`${base}/v1/records/h-01/completions`, { method: "POST", body: '{"day":"2026-03-02","__proto__":{"isAdmin":true}}' });
  assert.equal(done.status, 400);
  assert.deepEqual(done.json.error.details, JSON.parse('{"__proto__":"unknown-field"}'));
  assert.equal(({} as { isAdmin?: boolean }).isAdmin, undefined);
  assert.equal((await repository.list()).length, 6);
  assert.equal(Object.hasOwn((await repository.get("h-01"))!, "isAdmin"), false);
  assert.deepEqual((await repository.get("h-01"))!.completions, ["2026-02-27", "2026-02-28", "2026-03-01"]);
});

test("the list takes only known parameters, each once, and a limit of digits only", async (t) => {
  const { base } = await startServer(t);
  const cases: [string, Record<string, string>][] = [
    ["limit=1e1", { limit: "out-of-range" }],
    ["limit=", { limit: "out-of-range" }],
    ["limit=-1", { limit: "out-of-range" }],
    ["page=2", { page: "unknown-param" }],
    ["__proto__=x", JSON.parse('{"__proto__":"unknown-param"}')],
    ["sort=name&sort=name", { sort: "repeated" }],
    ["active=true&active=false", { active: "repeated" }],
    ["sort=constructor", { sort: "unknown-sort" }],
  ];
  for (const [query, details] of cases) {
    const answer = await send(`${base}/v1/records?${query}`);
    assert.equal(answer.status, 400, query);
    assert.deepEqual(answer.json.error.details, details, query);
  }
  assert.equal((await send(`${base}/v1/records?limit=07`)).status, 200);
});

test("an id that is not h-NN — ../, an escaped slash, a broken escape — is 400 before the store is read", async (t) => {
  const repository = await freshRepository();
  let reads = 0;
  const counted: HabitRepository = { ...repository, get: (id) => (reads++, repository.get(id)), update: (id, change) => (reads++, repository.update(id, change)), remove: (id) => (reads++, repository.remove(id)) };
  const { base } = await startServer(t, {}, counted);
  for (const id of ["..%2Fpackage.json", "..%2F..%2Fdata%2Fhabits.json", "h-01%2F..", "%E0", "h-1", "H-01"]) {
    const answer = await send(`${base}/v1/records/${id}`);
    assert.equal(answer.status, 400, id);
    assert.deepEqual(answer.json.error.details, { id: "malformed" }, id);
    const done = await send(`${base}/v1/records/${id}/completions`, { method: "POST", body: JSON.stringify({ day: "2026-03-02" }) });
    assert.equal(done.status, 400, `${id}/completions`);
    assert.deepEqual(done.json.error.details, { id: "malformed" }, `${id}/completions`);
  }
  assert.equal(reads, 0);
  assert.equal((await send(`${base}/v1/records/h-99`)).status, 404);
  assert.equal((await send(`${base}/v1/records/h-99/completions`, { method: "POST", body: JSON.stringify({ day: "2026-03-02" }) })).status, 404);
});

test("the edge refuses an unknown frequency, a blank or 81-character name and completions that are not unique ascending days", async (t) => {
  const { base, repository } = await startServer(t);
  const cases: [unknown, Record<string, string>][] = [
    [{ name: "%%fixture3Name%% 2", frequency: "monthly" }, { frequency: "unknown" }],
    [{ name: "%%fixture3Name%% 2", frequency: "Daily" }, { frequency: "unknown" }],
    [{ name: "   " }, { name: "required" }],
    [{ name: "x".repeat(81) }, { name: "too-long" }],
    [{ name: "%%fixture3Name%% 2", completions: ["2026-03-01", "2026-03-01"] }, { completions: "not-unique-ascending" }],
    [{ name: "%%fixture3Name%% 2", completions: ["2026-03-02", "2026-03-01"] }, { completions: "not-unique-ascending" }],
  ];
  for (const [body, details] of cases) {
    const answer = await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify(body) });
    assert.equal(answer.status, 400, JSON.stringify(body));
    assert.deepEqual(answer.json.error.details, details, JSON.stringify(body));
  }
  assert.equal((await repository.list()).length, 6);
});

test("completions must be days that exist: 2026-02-30 has the right form and is still 400, on a create, a patch and 'done today'", async (t) => {
  const { base, repository } = await startServer(t);
  for (const day of ["2026-02-30", "2026-02-29", "2026-04-31", "2026-13-01", "2026-00-10"]) {
    const created = await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify({ name: "%%fixture3Name%% 2", completions: ["2026-01-31", day] }) });
    assert.equal(created.status, 400, day);
    assert.deepEqual(created.json.error.details, { completions: "bad-date" }, day);
    const patched = await send(`${base}/v1/records/h-03`, { method: "PATCH", body: JSON.stringify({ completions: [day] }) });
    assert.deepEqual(patched.json.error.details, { completions: "bad-date" }, `PATCH ${day}`);
    const done = await send(`${base}/v1/records/h-03/completions`, { method: "POST", body: JSON.stringify({ day: day }) });
    assert.equal(done.status, 400, `completions ${day}`);
    assert.deepEqual(done.json.error.details, { day: "bad-date" }, `completions ${day}`);
  }
  assert.equal((await repository.list()).length, 6);
  assert.deepEqual((await repository.get("h-03"))!.completions, ["2026-03-01"]);
  // A leap day that exists is accepted.
  assert.equal((await send(`${base}/v1/records/h-03/completions`, { method: "POST", body: JSON.stringify({ day: "2028-02-29" }) })).status, 200);
  assert.equal((await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify({ name: "%%fixture3Name%% 2", completions: ["2024-02-29"] }) })).status, 201);
});

// `count` different, ascending, real days, one a day from 2020-01-01.
function days(count: number): string[] {
  return Array.from({ length: count }, (_, index) => new Date(Date.UTC(2020, 0, 1 + index)).toISOString().slice(0, 10));
}

test("a habit keeps at most MAX_COMPLETIONS days: a longer array is 400 too-many, and 'done today' cannot pass the limit", async (t) => {
  // 1001 days take about 13 KB: over the 4096-byte body limit (that alone would be a 413), so this server
  // gets a bigger body limit to reach the rule itself.
  const { base, repository } = await startServer(t, { maxBodyBytes: 64_000 });
  assert.equal(MAX_COMPLETIONS, 1000);
  const over = await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify({ name: "%%fixture3Name%% 2", completions: days(MAX_COMPLETIONS + 1) }) });
  assert.equal(over.status, 400);
  assert.deepEqual(over.json.error.details, { completions: "too-many" });
  assert.equal((await repository.list()).length, 6);
  const replaced = await send(`${base}/v1/records/h-03`, { method: "PUT", body: JSON.stringify({ name: "%%fixture3Name%%", completions: days(MAX_COMPLETIONS + 1) }) });
  assert.deepEqual(replaced.json.error.details, { completions: "too-many" });
  const full = await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify({ name: "%%fixture3Name%% 2", completions: days(MAX_COMPLETIONS) }) });
  assert.equal(full.status, 201);
  assert.equal(full.json.completions.length, MAX_COMPLETIONS);
  const url = `${base}/v1/records/${full.json.id}/completions`;
  const more = await send(url, { method: "POST", body: JSON.stringify({ day: "2030-01-01" }) });
  assert.equal(more.status, 400);
  assert.deepEqual(more.json.error.details, { completions: "too-many" });
  assert.equal((await repository.get(full.json.id))!.completions.length, MAX_COMPLETIONS);
  // A day the habit already has adds nothing, so a retry still answers 200.
  assert.equal((await send(url, { method: "POST", body: JSON.stringify({ day: "2020-01-01" }) })).status, 200);
});

// One body that breaks every field rule at once — a blank name, an unknown frequency, a day that does not
// exist, given twice — and the details it gets: one reason per field.
const EDGE_BODY = '{"name":"   ","frequency":"щомісяця","completions":["2026-02-30","2026-02-30"]}';
const EDGE_DETAILS = { name: "required", frequency: "unknown", completions: "bad-date" };

test("the request that breaks every field rule at once (edge-habits.json) names each field", async (t) => {
  const { base, repository } = await startServer(t);
  const answer = await send(`${base}/v1/records`, { method: "POST", body: EDGE_BODY });
  assert.equal(answer.status, 400);
  assert.deepEqual(answer.json.error.details, EDGE_DETAILS);
  assert.equal((await repository.list()).length, 6);
});

test("one JSON log line per request: request id, method, route without the query, status, duration — never the body", async (t) => {
  const { base, lines } = await startServer(t);
  const secretName = "%%fixture4Name%% SECRET-4471";
  const created = await send(`${base}/v1/records?trace=on`, { method: "POST", body: JSON.stringify({ name: secretName, frequency: "weekly", completions: ["2026-07-17"] }) });
  const listed = await send(`${base}/v1/records?sort=name&limit=2`);
  const refused = await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify({ name: secretName, frequency: "monthly" }) });
  const done = await send(`${base}/v1/records/${created.json.id}/completions?from=app`, { method: "POST", body: JSON.stringify({ day: "2026-07-18" }) });
  const renamed = await send(`${base}/v1/records/${created.json.id}`, { method: "PATCH", body: JSON.stringify({ name: `${secretName} 2` }) });
  const expected = [
    [created, "POST", "/v1/records", 201, "info"],
    [listed, "GET", "/v1/records", 200, "info"],
    [refused, "POST", "/v1/records", 400, "warn"],
    [done, "POST", `/v1/records/${created.json.id}/completions`, 200, "info"],
    [renamed, "PATCH", `/v1/records/${created.json.id}`, 200, "info"],
  ] as const;
  for (const [answer, method, route, status, level] of expected) {
    const line = (await lineOf(lines, answer.headers.get("x-request-id")!)) as RequestLine;
    assert.deepEqual(Object.keys(line).sort(), ["durationMs", "level", "method", "requestId", "route", "status", "time"]);
    assert.deepEqual({ method: line.method, route: line.route, status: line.status, level: line.level }, { method: method, route: route, status: status, level: level });
  }
  const logged = JSON.stringify(lines);
  assert.equal(logged.includes("SECRET-4471"), false);
  assert.equal(logged.includes("%%fixture4Name%%"), false);
  assert.equal(logged.includes("2026-07-1"), false);
  assert.equal(logged.includes("sort=name"), false);
  assert.equal(logged.includes("from=app"), false);
});

test("a well-formed incoming X-Request-Id is kept; a malformed one is replaced by the server's own", async (t) => {
  const { base, lines } = await startServer(t);
  const kept = await send(`${base}/v1/records/h-01`, { headers: { "x-request-id": "client-abc-12345" } });
  assert.equal(kept.headers.get("x-request-id"), "client-abc-12345");
  assert.equal((await lineOf(lines, "client-abc-12345")).requestId, "client-abc-12345");
  for (const bad of ["short", "x".repeat(65), "a b c d e f g h", "<script>alert(1)</script>"]) {
    const answer = await send(`${base}/v1/records/h-99`, { headers: { "x-request-id": bad } });
    const id = answer.headers.get("x-request-id")!;
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, bad);
    assert.equal(answer.json.error.requestId, id);
  }
  assert.equal(JSON.stringify(lines).includes("<script>"), false);
});

test("a failure inside logs the error's name with the request id, never its message", async (t) => {
  const repository = await freshRepository();
  const broken: HabitRepository = { ...repository, list: async () => { throw new TypeError("disk on fire near %%fixture6Name%%"); } };
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
