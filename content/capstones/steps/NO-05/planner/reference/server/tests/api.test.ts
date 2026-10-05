// Tests of the /v1 records API with node:test, over real HTTP on 127.0.0.1 and a port the system picks
// (listen(0)): `npm test` in server/. Every test gets its own data folder under server/.check/, seeded
// with the web project's starting tasks, and its own server, closed in t.after.
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { createFileRepository } from "../src/fileRepository.ts";
import type { TaskRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import { createRecordsServer } from "../src/server.ts";

async function freshRepository(): Promise<TaskRepository> {
  const repository = createFileRepository(path.join(import.meta.dirname, "..", ".check", "api", randomUUID()));
  await repository.seed(await loadFixtures());
  return repository;
}

async function startServer(t: TestContext, repository: TaskRepository): Promise<string> {
  const server = createRecordsServer(repository, () => {});
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

type Sent = { method?: string; body?: unknown; raw?: string; headers?: Record<string, string> };

async function send(url: string, { method = "GET", body, raw, headers = {} }: Sent = {}) {
  const response = await fetch(url, {
    method: method,
    headers: { "content-type": "application/json", ...headers },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
    signal: AbortSignal.timeout(2000),
  });
  const text = await response.text();
  return { status: response.status, headers: response.headers, json: text === "" ? undefined : JSON.parse(text) };
}

const NEW_TASK = { title: "%%fixture1Name%% 2", dueDate: "2026-03-04", priority: "high" };

test("create, read, replace, patch, delete and a 404 after it", async (t) => {
  const base = await startServer(t, await freshRepository());
  const created = await send(`${base}/v1/records`, { method: "POST", body: NEW_TASK });
  assert.equal(created.status, 201);
  assert.deepEqual(created.json, { id: "t-07", title: "%%fixture1Name%% 2", dueDate: "2026-03-04", done: false, priority: "high" });
  assert.deepEqual((await send(`${base}/v1/records/t-07`)).json, created.json);
  const replaced = await send(`${base}/v1/records/t-07`, { method: "PUT", body: { title: "%%fixture1Name%% 3" } });
  assert.equal(replaced.status, 200);
  assert.deepEqual(replaced.json, { id: "t-07", title: "%%fixture1Name%% 3", dueDate: null, done: false, priority: "normal" });
  const patched = await send(`${base}/v1/records/t-07`, { method: "PATCH", body: { done: true } });
  assert.equal(patched.status, 200);
  assert.deepEqual(patched.json, { ...replaced.json, done: true });
  assert.equal((await send(`${base}/v1/records/t-07`, { method: "DELETE" })).status, 204);
  const gone = await send(`${base}/v1/records/t-07`);
  assert.equal(gone.status, 404);
  assert.equal(gone.json.error.code, "NOT_FOUND");
});

test("an invalid create names every field and stores nothing", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const answer = await send(`${base}/v1/records`, { method: "POST", body: { title: "  ", dueDate: "04.03.2026", priority: "urgent", isAdmin: true } });
  assert.equal(answer.status, 400);
  assert.equal(answer.json.error.code, "VALIDATION_FAILED");
  assert.deepEqual(answer.json.error.details, { title: "required", dueDate: "bad-date", priority: "unknown", isAdmin: "unknown-field" });
  assert.equal((await repository.list()).length, 6);
});

test("the domain rules hold at the edge: 81 characters, a done that is not a boolean", async (t) => {
  const base = await startServer(t, await freshRepository());
  assert.deepEqual((await send(`${base}/v1/records`, { method: "POST", body: { title: "a".repeat(81) } })).json.error.details, { title: "too-long" });
  assert.deepEqual((await send(`${base}/v1/records`, { method: "POST", body: { title: "%%fixture1Name%%", done: "yes" } })).json.error.details, { done: "not-a-boolean" });
  assert.deepEqual((await send(`${base}/v1/records`, { method: "POST", body: { title: "%%fixture1Name%%", dueDate: 20260304 } })).json.error.details, { dueDate: "bad-date" });
  const longest = await send(`${base}/v1/records`, { method: "POST", body: { title: "a".repeat(80), dueDate: null, priority: "low" } });
  assert.equal(longest.status, 201);
});

test("an invalid PATCH changes nothing, and the list still sorts", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const before = await repository.get("t-01");
  const answer = await send(`${base}/v1/records/t-01`, { method: "PATCH", body: { dueDate: "tomorrow", title: null } });
  assert.equal(answer.status, 400);
  assert.deepEqual(answer.json.error.details, { title: "not-a-string", dueDate: "bad-date" });
  assert.deepEqual(await repository.get("t-01"), before);
  assert.equal((await send(`${base}/v1/records`)).status, 200);
  assert.deepEqual((await send(`${base}/v1/records/t-01`, { method: "PATCH", body: { id: "t-99" } })).json.error.details, { id: "unknown-field" });
});

test("every task exactly once across the pages, by due date and undated last", async (t) => {
  const base = await startServer(t, await freshRepository());
  const { ids, pages } = await allPages(base, "limit=4");
  assert.deepEqual(ids, ["t-04", "t-02", "t-01", "t-06", "t-05", "t-03"]);
  assert.equal(pages, 2);
});

test("tasks with the same due date are not lost at a page boundary (the id breaks the tie)", async (t) => {
  const base = await startServer(t, await freshRepository());
  for (const title of ["%%fixture1Name%% A", "%%fixture1Name%% B", "%%fixture1Name%% C"]) {
    await send(`${base}/v1/records`, { method: "POST", body: { title: title, dueDate: "2026-03-02" } });
  }
  const { ids } = await allPages(base, "sort=dueDate&limit=2");
  assert.deepEqual(ids, ["t-04", "t-02", "t-01", "t-07", "t-08", "t-09", "t-06", "t-05", "t-03"]);
});

test("filters by done and dueBefore, and a page that ends at the last task has nextCursor null", async (t) => {
  const base = await startServer(t, await freshRepository());
  const done = await send(`${base}/v1/records?done=true&limit=2`);
  assert.deepEqual(done.json.items.map((task: { id: string }) => task.id), ["t-04", "t-06"]);
  assert.equal(done.json.nextCursor, null);
  assert.deepEqual((await allPages(base, "dueBefore=2026-03-02")).ids, ["t-04", "t-02"]);
  assert.deepEqual((await allPages(base, "done=false&dueBefore=2026-03-02")).ids, ["t-02"]);
});

test("an unknown cursor, a bad limit, sort or filter are 400 with a reason", async (t) => {
  const base = await startServer(t, await freshRepository());
  assert.deepEqual((await send(`${base}/v1/records?cursor=t-99`)).json.error.details, { cursor: "unknown-cursor" });
  for (const limit of ["0", "51", "abc", "1e1"]) {
    assert.deepEqual((await send(`${base}/v1/records?limit=${limit}`)).json.error.details, { limit: "out-of-range" }, limit);
  }
  assert.deepEqual((await send(`${base}/v1/records?sort=title`)).json.error.details, { sort: "unknown-sort" });
  assert.deepEqual((await send(`${base}/v1/records?done=yes`)).json.error.details, { done: "not-a-boolean" });
  assert.deepEqual((await send(`${base}/v1/records?dueBefore=2026-3-2`)).json.error.details, { dueBefore: "bad-date" });
});

test("malformed JSON is 400 MALFORMED_JSON and a body over 4096 bytes is 413", async (t) => {
  const base = await startServer(t, await freshRepository());
  const broken = await send(`${base}/v1/records`, { method: "POST", raw: '{"x": "unfinish' });
  assert.equal(broken.status, 400);
  assert.equal(broken.json.error.code, "MALFORMED_JSON");
  const big = await send(`${base}/v1/records`, { method: "POST", body: { ...NEW_TASK, note: "x".repeat(5000) } });
  assert.equal(big.status, 413);
  assert.equal(big.json.error.code, "PAYLOAD_TOO_LARGE");
});

test("a retried POST with the same Idempotency-Key creates one task", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const headers = { "idempotency-key": "k-1" };
  const first = await send(`${base}/v1/records`, { method: "POST", body: NEW_TASK, headers: headers });
  const again = await send(`${base}/v1/records`, { method: "POST", body: NEW_TASK, headers: headers });
  assert.equal(first.status, 201);
  assert.equal(again.status, 201);
  assert.deepEqual(again.json, first.json);
  assert.equal((await repository.list()).length, 7);
  const other = await send(`${base}/v1/records`, { method: "POST", body: { ...NEW_TASK, title: "%%fixture1Name%% 4" }, headers: headers });
  assert.equal(other.status, 422);
  assert.equal(other.json.error.code, "IDEMPOTENCY_KEY_REUSED");
  assert.equal((await repository.list()).length, 7);
});

test("unknown addresses are 404, other methods 405 with Allow", async (t) => {
  const base = await startServer(t, await freshRepository());
  const unknown = await send(`${base}/v1/nothing`);
  assert.equal(unknown.status, 404);
  assert.equal(unknown.json.error.code, "NOT_FOUND");
  const wrong = await send(`${base}/v1/records`, { method: "DELETE" });
  assert.equal(wrong.status, 405);
  assert.equal(wrong.headers.get("allow"), "GET, POST");
  assert.equal(wrong.json.error.code, "METHOD_NOT_ALLOWED");
  assert.equal((await send(`${base}/v1/records/t-01`, { method: "POST", body: {} })).headers.get("allow"), "GET, PUT, PATCH, DELETE");
  assert.equal((await send(`${base}/v1/records/%E0`)).status, 400);
  assert.equal((await send(`${base}/records`)).status, 200); // the unversioned endpoint of the previous step
});

test("a failure inside is 500 INTERNAL with the request id and no stack", async (t) => {
  const repository = await freshRepository();
  const broken: TaskRepository = { ...repository, list: async () => { throw new TypeError("disk on fire"); } };
  const base = await startServer(t, broken);
  const realError = console.error;
  console.error = () => {}; // the server logs the stack; keep the test output short
  t.after(() => { console.error = realError; });
  const answer = await send(`${base}/v1/records`);
  assert.equal(answer.status, 500);
  assert.deepEqual(answer.json, { error: { code: "INTERNAL", messageKey: "errors.internal", details: {}, requestId: answer.headers.get("x-request-id") } });
});

test("the records are in the file: a new server on the same folder answers them", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const created = await send(`${base}/v1/records`, { method: "POST", body: NEW_TASK });
  const again = await startServer(t, createFileRepository(path.dirname(repository.file)));
  assert.deepEqual((await send(`${again}/v1/records/${created.json.id}`)).json, created.json);
});

// Follows nextCursor from the first page to the last; returns every id in the order of the pages.
async function allPages(base: string, query: string): Promise<{ ids: string[]; pages: number }> {
  const ids: string[] = [];
  let cursor: string | null = null;
  let pages = 0;
  do {
    const more: string = cursor === null ? "" : `&cursor=${cursor}`;
    const page = await send(`${base}/v1/records?${query}${more}`);
    assert.equal(page.status, 200, JSON.stringify(page.json));
    ids.push(...page.json.items.map((record: { id: string }) => record.id));
    cursor = page.json.nextCursor;
    pages += 1;
  } while (cursor !== null && pages < 20);
  return { ids: ids, pages: pages };
}
