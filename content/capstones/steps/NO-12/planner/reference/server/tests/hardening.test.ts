// Tests of the edge of the records server over real HTTP: body limits (with and without Content-Length),
// the server's timeouts, malformed bodies, prototype keys, the query allowlist and the sort values, ids
// from the path, the field rules of a task, the JSON log lines and the request id, and the loopback default. Requests a fetch cannot send — a chunked
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
import type { TaskRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import type { LogLine, RequestLine } from "../src/log.ts";
import { createRecordsServer } from "../src/server.ts";
import type { Limits } from "../src/server.ts";

async function freshRepository(): Promise<TaskRepository> {
  const repository = createFileRepository(path.join(import.meta.dirname, "..", ".check", "hardening", randomUUID()));
  await repository.seed(await loadFixtures());
  return repository;
}

type Started = { base: string; port: number; lines: LogLine[]; repository: TaskRepository };

async function startServer(t: TestContext, limits: Partial<Limits> = {}, repository?: TaskRepository): Promise<Started> {
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
  assert.equal((await send(`${base}/v1/records`, { method: "POST", body: '{"title": ' })).json.error.code, "MALFORMED_JSON");
  const notUtf8 = await send(`${base}/v1/records`, { method: "POST", body: new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]) });
  assert.equal(notUtf8.status, 400);
  assert.equal(notUtf8.json.error.code, "MALFORMED_JSON");
});

test("__proto__ and constructor in a body are unknown fields, and no prototype changes", async (t) => {
  const { base, repository } = await startServer(t);
  const created = await send(`${base}/v1/records`, { method: "POST", body: '{"title":"%%fixture1Name%% 3","__proto__":{"isAdmin":true},"constructor":{"prototype":{"isAdmin":true}}}' });
  assert.equal(created.status, 400);
  assert.deepEqual(created.json.error.details, JSON.parse('{"__proto__":"unknown-field","constructor":"unknown-field"}')); // JSON.parse: an own "__proto__" key
  const patched = await send(`${base}/v1/records/t-01`, { method: "PATCH", body: '{"__proto__":{"isAdmin":true}}' });
  assert.equal(patched.status, 400);
  assert.equal(({} as { isAdmin?: boolean }).isAdmin, undefined);
  assert.equal((await repository.list()).length, 6);
  assert.equal(Object.hasOwn((await repository.get("t-01"))!, "isAdmin"), false);
});

test("the list takes only known parameters, each once, and a limit of digits only", async (t) => {
  const { base } = await startServer(t);
  const cases: [string, Record<string, string>][] = [
    ["limit=1e1", { limit: "out-of-range" }],
    ["limit=", { limit: "out-of-range" }],
    ["limit=-1", { limit: "out-of-range" }],
    ["page=2", { page: "unknown-param" }],
    ["__proto__=x", JSON.parse('{"__proto__":"unknown-param"}')],
    ["sort=title&sort=priority", { sort: "repeated" }],
    ["sort=constructor", { sort: "unknown-sort" }],
    ["done=true&done=false", { done: "repeated" }],
  ];
  for (const [query, details] of cases) {
    const answer = await send(`${base}/v1/records?${query}`);
    assert.equal(answer.status, 400, query);
    assert.deepEqual(answer.json.error.details, details, query);
  }
  assert.equal((await send(`${base}/v1/records?limit=07`)).status, 200);
});

test("an id that is not t-NN — ../, an escaped slash, a broken escape — is 400 before the store is read", async (t) => {
  const repository = await freshRepository();
  let reads = 0;
  const counted: TaskRepository = { ...repository, get: (id) => (reads++, repository.get(id)), update: (id, change) => (reads++, repository.update(id, change)), remove: (id) => (reads++, repository.remove(id)) };
  const { base } = await startServer(t, {}, counted);
  for (const id of ["..%2Fpackage.json", "..%2F..%2Fdata%2Fplanner.json", "t-01%2F..", "%E0", "t-1", "T-01"]) {
    const answer = await send(`${base}/v1/records/${id}`);
    assert.equal(answer.status, 400, id);
    assert.deepEqual(answer.json.error.details, { id: "malformed" }, id);
  }
  assert.equal(reads, 0);
  assert.equal((await send(`${base}/v1/records/t-99`)).status, 404);
});

test("the edge refuses a blank or 81-character title, a dueDate that is no real day and a priority outside low, normal, high", async (t) => {
  const { base, repository } = await startServer(t);
  const cases: [unknown, Record<string, string>][] = [
    [{ title: "   " }, { title: "required" }],
    [{ title: "x".repeat(81) }, { title: "too-long" }],
    [{ title: "x", dueDate: "2026-02-31" }, { dueDate: "bad-date" }],
    [{ title: "x", dueDate: "2026-02-29" }, { dueDate: "bad-date" }],
    [{ title: "x", dueDate: "2026-13-01" }, { dueDate: "bad-date" }],
    [{ title: "x", dueDate: "2026-3-1" }, { dueDate: "bad-date" }],
    [{ title: "x", priority: "urgent" }, { priority: "unknown" }],
    [{ title: "x", priority: "HIGH" }, { priority: "unknown" }],
  ];
  for (const [body, details] of cases) {
    const answer = await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify(body) });
    assert.equal(answer.status, 400, JSON.stringify(body));
    assert.deepEqual(answer.json.error.details, details, JSON.stringify(body));
  }
  // A day that does not exist is refused on a replace and on a merge too, and the stored task stays.
  const put = await send(`${base}/v1/records/t-01`, { method: "PUT", body: JSON.stringify({ title: "x", dueDate: "2026-04-31" }) });
  assert.deepEqual([put.status, put.json.error.details], [400, { dueDate: "bad-date" }]);
  const patched = await send(`${base}/v1/records/t-01`, { method: "PATCH", body: JSON.stringify({ dueDate: "2026-02-30" }) });
  assert.deepEqual([patched.status, patched.json.error.details], [400, { dueDate: "bad-date" }]);
  assert.equal((await repository.get("t-01"))!.dueDate, "2026-03-02");
  assert.equal((await repository.list()).length, 6);
  // The edges of the rules still pass: 80 characters, a leap day, each priority.
  for (const body of [{ title: "x".repeat(80) }, { title: "x", dueDate: "2028-02-29" }, { title: "x", priority: "low" }, { title: "x", priority: "normal" }, { title: "x", priority: "high" }]) {
    assert.equal((await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify(body) })).status, 201, JSON.stringify(body));
  }
});

test("the edge body of the task refuses every field at once", async (t) => {
  const { base, repository } = await startServer(t);
  const body = '{"title":"   ","dueDate":"2026-02-31","priority":"терміново"}';
  const answer = await send(`${base}/v1/records`, { method: "POST", body: body });
  assert.equal(answer.status, 400);
  assert.deepEqual(answer.json.error.details, { title: "required", dueDate: "bad-date", priority: "unknown" });
  assert.equal((await repository.list()).length, 6);
});

// Every id once, across all the pages of a sort, following nextCursor.
async function sortedIds(base: string, sort: string): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const answer = await send(`${base}/v1/records?sort=${sort}&limit=2${cursor === null ? "" : `&cursor=${cursor}`}`);
    assert.equal(answer.status, 200, sort);
    ids.push(...answer.json.items.map((task: { id: string }) => task.id));
    cursor = answer.json.nextCursor;
    if (cursor === null) {
      return ids;
    }
  }
  throw new Error(`no last page for sort=${sort}`);
}

test("?sort takes title, dueDate and priority, each across cursor pages with the id for ties; any other value is 400 unknown-sort", async (t) => {
  // Own tasks instead of the starting ones, so the expected orders do not depend on the project's language:
  // an equal title, an equal due date and equal priorities, so the id has to break the ties.
  const repository = createFileRepository(path.join(import.meta.dirname, "..", ".check", "hardening", randomUUID()));
  await repository.seed([
    { id: "t-01", title: "Купити хліб", dueDate: "2026-03-02", done: false, priority: "normal" },
    { id: "t-02", title: "Ґанок пофарбувати", dueDate: "2026-03-01", done: false, priority: "high" },
    { id: "t-03", title: "Абонемент продовжити", dueDate: null, done: false, priority: "low" },
    { id: "t-04", title: "Купити хліб", dueDate: "2026-02-27", done: true, priority: "high" },
    { id: "t-05", title: "Єнот у зоопарку", dueDate: "2026-03-02", done: false, priority: "normal" },
    { id: "t-06", title: "Яблука", dueDate: "2026-03-05", done: true, priority: "low" },
  ]);
  const { base } = await startServer(t, {}, repository);
  // Titles in the Ukrainian alphabet: А, Ґ, Є, К, Я (in a code-point order Є would go first and Ґ last).
  assert.deepEqual(await sortedIds(base, "title"), ["t-03", "t-02", "t-05", "t-01", "t-04", "t-06"]);
  assert.deepEqual(await sortedIds(base, "priority"), ["t-02", "t-04", "t-01", "t-05", "t-03", "t-06"]);
  assert.deepEqual(await sortedIds(base, "dueDate"), ["t-04", "t-02", "t-01", "t-05", "t-06", "t-03"]);
  assert.deepEqual((await send(`${base}/v1/records?limit=50`)).json.items.map((task: { id: string }) => task.id), ["t-04", "t-02", "t-01", "t-05", "t-06", "t-03"]);
  for (const sort of ["name", "DUEDATE", "", "__proto__", "title,priority"]) {
    const answer = await send(`${base}/v1/records?sort=${encodeURIComponent(sort)}`);
    assert.equal(answer.status, 400, sort);
    assert.deepEqual(answer.json.error.details, { sort: "unknown-sort" }, sort);
  }
});

test("one JSON log line per request: request id, method, route without the query, status, duration — never the body", async (t) => {
  const { base, lines } = await startServer(t);
  const secretTitle = "Забрати посилку SECRET-7781";
  const created = await send(`${base}/v1/records?trace=on`, { method: "POST", body: JSON.stringify({ title: secretTitle, dueDate: "2031-07-19", priority: "high" }) });
  const listed = await send(`${base}/v1/records?sort=priority&limit=2`);
  const refused = await send(`${base}/v1/records`, { method: "POST", body: JSON.stringify({ title: secretTitle, dueDate: "2031-02-30" }) });
  for (const [answer, method, status, level] of [[created, "POST", 201, "info"], [listed, "GET", 200, "info"], [refused, "POST", 400, "warn"]] as const) {
    const line = (await lineOf(lines, answer.headers.get("x-request-id")!)) as RequestLine;
    assert.deepEqual(Object.keys(line).sort(), ["durationMs", "level", "method", "requestId", "route", "status", "time"]);
    assert.deepEqual({ method: line.method, route: line.route, status: line.status, level: line.level }, { method: method, route: "/v1/records", status: status, level: level });
  }
  const logged = JSON.stringify(lines);
  assert.equal(logged.includes("SECRET-7781"), false);
  assert.equal(logged.includes("2031-07-19"), false);
  assert.equal(logged.includes("2031-02-30"), false);
  assert.equal(logged.includes("sort=priority"), false);
});

test("a well-formed incoming X-Request-Id is kept; a malformed one is replaced by the server's own", async (t) => {
  const { base, lines } = await startServer(t);
  const kept = await send(`${base}/v1/records/t-01`, { headers: { "x-request-id": "client-abc-12345" } });
  assert.equal(kept.headers.get("x-request-id"), "client-abc-12345");
  assert.equal((await lineOf(lines, "client-abc-12345")).requestId, "client-abc-12345");
  for (const bad of ["short", "x".repeat(65), "a b c d e f g h", "<script>alert(1)</script>"]) {
    const answer = await send(`${base}/v1/records/t-99`, { headers: { "x-request-id": bad } });
    const id = answer.headers.get("x-request-id")!;
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, bad);
    assert.equal(answer.json.error.requestId, id);
  }
  assert.equal(JSON.stringify(lines).includes("<script>"), false);
});

test("a failure inside logs the error's name with the request id, never its message", async (t) => {
  const repository = await freshRepository();
  const broken: TaskRepository = { ...repository, list: async () => { throw new TypeError("disk on fire near %%fixture1Name%%"); } };
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
