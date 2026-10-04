// Tests of the /v1 records API with node:test, over real HTTP on 127.0.0.1 and a port the system picks
// (listen(0)): `npm test` in server/. Every test gets its own data folder under server/.check/, seeded
// with the web project's starting wishes, and its own server, closed in t.after.
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { createFileRepository } from "../src/fileRepository.ts";
import type { WishRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import { createRecordsServer } from "../src/server.ts";

async function freshRepository(): Promise<WishRepository> {
  const repository = createFileRepository(path.join(import.meta.dirname, "..", ".check", "api", randomUUID()));
  await repository.seed(await loadFixtures());
  return repository;
}

async function startServer(t: TestContext, repository: WishRepository): Promise<string> {
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

const NEW_WISH = { name: "%%fixture1Name%% 2", price: 30, category: "%%homeCategory%%" };

test("create, read, replace, patch, delete and a 404 after it", async (t) => {
  const base = await startServer(t, await freshRepository());
  const created = await send(`${base}/v1/records`, { method: "POST", body: NEW_WISH });
  assert.equal(created.status, 201);
  assert.deepEqual(created.json, { id: "w-07", name: "%%fixture1Name%% 2", price: 30, acquired: false, category: "%%homeCategory%%" });
  assert.deepEqual((await send(`${base}/v1/records/w-07`)).json, created.json);
  const replaced = await send(`${base}/v1/records/w-07`, { method: "PUT", body: { name: "%%fixture1Name%% 3" } });
  assert.equal(replaced.status, 200);
  assert.deepEqual(replaced.json, { id: "w-07", name: "%%fixture1Name%% 3", price: null, acquired: false, category: null });
  const patched = await send(`${base}/v1/records/w-07`, { method: "PATCH", body: { acquired: true } });
  assert.equal(patched.status, 200);
  assert.equal(patched.json.acquired, true);
  assert.equal(patched.json.name, "%%fixture1Name%% 3");
  const removed = await send(`${base}/v1/records/w-07`, { method: "DELETE" });
  assert.equal(removed.status, 204);
  assert.equal(removed.json, undefined);
  const gone = await send(`${base}/v1/records/w-07`);
  assert.equal(gone.status, 404);
  assert.equal(gone.json.error.code, "NOT_FOUND");
});

test("an invalid create names every field and stores nothing", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const answer = await send(`${base}/v1/records`, { method: "POST", body: { name: "  ", price: "45", category: "x".repeat(31), isAdmin: true } });
  assert.equal(answer.status, 400);
  assert.equal(answer.json.error.code, "VALIDATION_FAILED");
  assert.deepEqual(answer.json.error.details, { name: "required", price: "not-a-number", category: "too-long", isAdmin: "unknown-field" });
  assert.equal((await repository.list()).length, 6);
});

test("the domain rules hold at the edge: 81 characters, a negative or a fractional price", async (t) => {
  const base = await startServer(t, await freshRepository());
  for (const [body, details] of [
    [{ name: "a".repeat(81) }, { name: "too-long" }],
    [{ name: "%%fixture1Name%%", price: -1 }, { price: "negative" }],
    [{ name: "%%fixture1Name%%", price: 12.5 }, { price: "not-whole" }],
    [{ name: "%%fixture1Name%%", acquired: "yes" }, { acquired: "not-a-boolean" }],
  ] as const) {
    const answer = await send(`${base}/v1/records`, { method: "POST", body: body });
    assert.equal(answer.status, 400, JSON.stringify(body));
    assert.deepEqual(answer.json.error.details, details);
  }
  assert.equal((await send(`${base}/v1/records`, { method: "POST", body: { name: "a".repeat(80), price: 0, category: null } })).status, 201);
});

test("an invalid PATCH changes nothing, and the list still sorts", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const before = await repository.get("w-02");
  const answer = await send(`${base}/v1/records/w-02`, { method: "PATCH", body: { price: "45", name: null } });
  assert.equal(answer.status, 400);
  assert.deepEqual(answer.json.error.details, { name: "not-a-string", price: "not-a-number" });
  assert.deepEqual(await repository.get("w-02"), before);
  assert.equal((await send(`${base}/v1/records?sort=name`)).status, 200);
  const withId = await send(`${base}/v1/records/w-02`, { method: "PATCH", body: { id: "w-99" } });
  assert.deepEqual(withId.json.error.details, { id: "unknown-field" });
});

test("malformed JSON is 400 MALFORMED_JSON and a body over 4096 bytes is 413", async (t) => {
  const base = await startServer(t, await freshRepository());
  const broken = await send(`${base}/v1/records`, { method: "POST", raw: '{"name": "unfinish' });
  assert.equal(broken.status, 400);
  assert.equal(broken.json.error.code, "MALFORMED_JSON");
  const big = await send(`${base}/v1/records`, { method: "POST", body: { name: "%%fixture1Name%%", note: "x".repeat(5000) } });
  assert.equal(big.status, 413);
  assert.equal(big.json.error.code, "PAYLOAD_TOO_LARGE");
});

test("every wish exactly once across the pages, cheaper first and no price last", async (t) => {
  const base = await startServer(t, await freshRepository());
  const ids: string[] = [];
  let cursor: string | null = null;
  let pages = 0;
  do {
    const query: string = cursor === null ? "" : `&cursor=${cursor}`;
    const page = await send(`${base}/v1/records?sort=price&limit=4${query}`);
    assert.equal(page.status, 200);
    ids.push(...page.json.items.map((wish: { id: string }) => wish.id));
    cursor = page.json.nextCursor;
    pages += 1;
  } while (cursor !== null && pages < 10);
  assert.deepEqual(ids, ["w-06", "w-04", "w-02", "w-01", "w-03", "w-05"]);
  assert.equal(pages, 2);
});

test("wishes with an equal price are not lost at a page boundary (the id breaks the tie)", async (t) => {
  const base = await startServer(t, await freshRepository());
  for (const name of ["%%fixture1Name%% A", "%%fixture1Name%% B", "%%fixture1Name%% C"]) {
    await send(`${base}/v1/records`, { method: "POST", body: { name: name, price: 45 } });
  }
  const ids: string[] = [];
  let cursor: string | null = null;
  do {
    const query: string = cursor === null ? "" : `&cursor=${cursor}`;
    const page = await send(`${base}/v1/records?sort=price&limit=2${query}`);
    ids.push(...page.json.items.map((wish: { id: string }) => wish.id));
    cursor = page.json.nextCursor;
  } while (cursor !== null && ids.length < 20);
  // Four wishes cost 45 (w-02 and the three new ones); every one of the nine appears once.
  assert.deepEqual(ids, ["w-06", "w-04", "w-02", "w-07", "w-08", "w-09", "w-01", "w-03", "w-05"]);
});

test("a page that ends exactly at the last wish has nextCursor null", async (t) => {
  const base = await startServer(t, await freshRepository());
  const page = await send(`${base}/v1/records?acquired=true&limit=2`);
  assert.deepEqual(page.json.items.map((wish: { id: string }) => wish.id).toSorted(), ["w-04", "w-06"]);
  assert.equal(page.json.nextCursor, null);
  const wanted = await send(`${base}/v1/records?acquired=false`);
  assert.equal(wanted.json.items.every((wish: { acquired: boolean }) => !wish.acquired), true);
  assert.equal(wanted.json.items.length, 4);
});

test("an unknown cursor, a bad limit, sort or filter are 400 with a reason", async (t) => {
  const base = await startServer(t, await freshRepository());
  assert.deepEqual((await send(`${base}/v1/records?cursor=w-99`)).json.error.details, { cursor: "unknown-cursor" });
  for (const limit of ["0", "51", "abc", "1e1"]) {
    assert.deepEqual((await send(`${base}/v1/records?limit=${limit}`)).json.error.details, { limit: "out-of-range" }, limit);
  }
  assert.deepEqual((await send(`${base}/v1/records?sort=date`)).json.error.details, { sort: "unknown-sort" });
  assert.deepEqual((await send(`${base}/v1/records?acquired=yes`)).json.error.details, { acquired: "not-a-boolean" });
});

test("a retried POST with the same Idempotency-Key creates one wish", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const headers = { "idempotency-key": "k-1" };
  const first = await send(`${base}/v1/records`, { method: "POST", body: NEW_WISH, headers: headers });
  const again = await send(`${base}/v1/records`, { method: "POST", body: NEW_WISH, headers: headers });
  assert.equal(first.status, 201);
  assert.equal(again.status, 201);
  assert.deepEqual(again.json, first.json);
  assert.equal((await repository.list()).length, 7);
  const other = await send(`${base}/v1/records`, { method: "POST", body: { name: "%%fixture1Name%% 4" }, headers: headers });
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
  assert.equal((await send(`${base}/v1/records/w-01`, { method: "POST", body: {} })).headers.get("allow"), "GET, PUT, PATCH, DELETE");
  assert.equal((await send(`${base}/v1/records/%E0`)).status, 400);
  assert.equal((await send(`${base}/records`)).status, 200); // the unversioned endpoint of the previous step
});

test("a failure inside is 500 INTERNAL with the request id and no stack", async (t) => {
  const repository = await freshRepository();
  const broken: WishRepository = { ...repository, list: async () => { throw new TypeError("disk on fire"); } };
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
  await send(`${base}/v1/records`, { method: "POST", body: NEW_WISH });
  const again = await startServer(t, createFileRepository(path.dirname(repository.file)));
  assert.equal((await send(`${again}/v1/records/w-07`)).json.name, "%%fixture1Name%% 2");
});
