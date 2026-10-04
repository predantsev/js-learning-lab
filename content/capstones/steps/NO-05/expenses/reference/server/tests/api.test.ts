// Tests of the /v1 records API with node:test, over real HTTP on 127.0.0.1 and a port the system picks
// (listen(0)): `npm test` in server/. Every test gets its own data folder under server/.check/, seeded
// with the web project's starting expenses, and its own server, closed in t.after.
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { createFileRepository } from "../src/fileRepository.ts";
import type { ExpenseRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import { createRecordsServer } from "../src/server.ts";

async function freshRepository(): Promise<ExpenseRepository> {
  const repository = createFileRepository(path.join(import.meta.dirname, "..", ".check", "api", randomUUID()));
  await repository.seed(await loadFixtures());
  return repository;
}

async function startServer(t: TestContext, repository: ExpenseRepository): Promise<string> {
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

const NEW_EXPENSE = { label: "%%fixture1Name%% 2", amountMinor: 6500, date: "2026-03-03", category: "food" };

test("create, read, replace, patch, delete and a 404 after it", async (t) => {
  const base = await startServer(t, await freshRepository());
  const created = await send(`${base}/v1/records`, { method: "POST", body: NEW_EXPENSE });
  assert.equal(created.status, 201);
  assert.deepEqual(created.json, { id: "e-07", ...NEW_EXPENSE });
  assert.deepEqual((await send(`${base}/v1/records/e-07`)).json, created.json);
  const replaced = await send(`${base}/v1/records/e-07`, { method: "PUT", body: { label: "%%fixture1Name%% 3", amountMinor: 100, date: "2026-03-04", category: "fun" } });
  assert.equal(replaced.status, 200);
  assert.deepEqual(replaced.json, { id: "e-07", label: "%%fixture1Name%% 3", amountMinor: 100, date: "2026-03-04", category: "fun" });
  const patched = await send(`${base}/v1/records/e-07`, { method: "PATCH", body: { amountMinor: 7000 } });
  assert.equal(patched.status, 200);
  assert.deepEqual(patched.json, { ...replaced.json, amountMinor: 7000 });
  assert.equal((await send(`${base}/v1/records/e-07`, { method: "DELETE" })).status, 204);
  const gone = await send(`${base}/v1/records/e-07`);
  assert.equal(gone.status, 404);
  assert.equal(gone.json.error.code, "NOT_FOUND");
});

test("an invalid create names every field and stores nothing", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const answer = await send(`${base}/v1/records`, { method: "POST", body: { label: "", amountMinor: 12.5, date: "2026-3-3", category: "travel", isAdmin: true } });
  assert.equal(answer.status, 400);
  assert.equal(answer.json.error.code, "VALIDATION_FAILED");
  assert.deepEqual(answer.json.error.details, { label: "required", amountMinor: "not-positive-integer", date: "bad-date", category: "unknown", isAdmin: "unknown-field" });
  assert.equal((await repository.list()).length, 6);
});

test("the domain rules hold at the edge: a positive whole amountMinor, 80 characters, a full body for PUT", async (t) => {
  const base = await startServer(t, await freshRepository());
  const post = async (body: unknown) => (await send(`${base}/v1/records`, { method: "POST", body: body })).json.error.details;
  assert.deepEqual(await post({ ...NEW_EXPENSE, amountMinor: 0 }), { amountMinor: "not-positive-integer" });
  assert.deepEqual(await post({ ...NEW_EXPENSE, amountMinor: "6500" }), { amountMinor: "not-positive-integer" });
  assert.deepEqual(await post({ ...NEW_EXPENSE, label: "a".repeat(81) }), { label: "too-long" });
  assert.deepEqual((await send(`${base}/v1/records/e-01`, { method: "PUT", body: { label: "%%fixture1Name%%", amountMinor: 100, date: "2026-03-04" } })).json.error.details, { category: "unknown" });
  assert.equal((await send(`${base}/v1/records`, { method: "POST", body: { ...NEW_EXPENSE, label: "a".repeat(80), amountMinor: 1 } })).status, 201);
});

test("an invalid PATCH changes nothing, and the list still sorts", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const before = await repository.get("e-01");
  const answer = await send(`${base}/v1/records/e-01`, { method: "PATCH", body: { amountMinor: -5, label: null } });
  assert.equal(answer.status, 400);
  assert.deepEqual(answer.json.error.details, { label: "not-a-string", amountMinor: "not-positive-integer" });
  assert.deepEqual(await repository.get("e-01"), before);
  assert.equal((await send(`${base}/v1/records?sort=amountMinor`)).status, 200);
  assert.deepEqual((await send(`${base}/v1/records/e-01`, { method: "PATCH", body: { id: "e-99" } })).json.error.details, { id: "unknown-field" });
});

test("every expense exactly once across the pages, by date or by amount", async (t) => {
  const base = await startServer(t, await freshRepository());
  const byDate = await allPages(base, "limit=4");
  assert.deepEqual(byDate.ids, ["e-04", "e-05", "e-03", "e-01", "e-02", "e-06"]);
  assert.equal(byDate.pages, 2);
  assert.deepEqual((await allPages(base, "sort=amountMinor&limit=4")).ids, ["e-04", "e-03", "e-06", "e-05", "e-02", "e-01"]);
});

test("expenses with the same amount are not lost at a page boundary (the id breaks the tie)", async (t) => {
  const base = await startServer(t, await freshRepository());
  for (let count = 0; count < 3; count += 1) {
    await send(`${base}/v1/records`, { method: "POST", body: { ...NEW_EXPENSE, amountMinor: 21050 } });
  }
  const { ids } = await allPages(base, "sort=amountMinor&limit=2");
  assert.deepEqual(ids, ["e-04", "e-03", "e-06", "e-07", "e-08", "e-09", "e-05", "e-02", "e-01"]);
});

test("filters by category and a date range, and a page that ends at the last expense has nextCursor null", async (t) => {
  const base = await startServer(t, await freshRepository());
  const fun = await send(`${base}/v1/records?category=fun&limit=2`);
  assert.deepEqual(fun.json.items.map((expense: { id: string }) => expense.id), ["e-05", "e-03"]);
  assert.equal(fun.json.nextCursor, null);
  assert.deepEqual((await allPages(base, "from=2026-02-28&to=2026-03-01")).ids, ["e-03", "e-01", "e-02"]);
  assert.deepEqual((await allPages(base, "category=food&from=2026-03-02")).ids, ["e-06"]);
});

test("an unknown cursor, a bad limit, sort or filter are 400 with a reason", async (t) => {
  const base = await startServer(t, await freshRepository());
  assert.deepEqual((await send(`${base}/v1/records?cursor=e-99`)).json.error.details, { cursor: "unknown-cursor" });
  for (const limit of ["0", "51", "abc", "1e1"]) {
    assert.deepEqual((await send(`${base}/v1/records?limit=${limit}`)).json.error.details, { limit: "out-of-range" }, limit);
  }
  assert.deepEqual((await send(`${base}/v1/records?sort=label`)).json.error.details, { sort: "unknown-sort" });
  assert.deepEqual((await send(`${base}/v1/records?category=travel`)).json.error.details, { category: "unknown" });
  assert.deepEqual((await send(`${base}/v1/records?from=yesterday&to=2026-3-1`)).json.error.details, { from: "bad-date", to: "bad-date" });
});

test("malformed JSON is 400 MALFORMED_JSON and a body over 4096 bytes is 413", async (t) => {
  const base = await startServer(t, await freshRepository());
  const broken = await send(`${base}/v1/records`, { method: "POST", raw: '{"x": "unfinish' });
  assert.equal(broken.status, 400);
  assert.equal(broken.json.error.code, "MALFORMED_JSON");
  const big = await send(`${base}/v1/records`, { method: "POST", body: { ...NEW_EXPENSE, note: "x".repeat(5000) } });
  assert.equal(big.status, 413);
  assert.equal(big.json.error.code, "PAYLOAD_TOO_LARGE");
});

test("a retried POST with the same Idempotency-Key creates one expense", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const headers = { "idempotency-key": "k-1" };
  const first = await send(`${base}/v1/records`, { method: "POST", body: NEW_EXPENSE, headers: headers });
  const again = await send(`${base}/v1/records`, { method: "POST", body: NEW_EXPENSE, headers: headers });
  assert.equal(first.status, 201);
  assert.equal(again.status, 201);
  assert.deepEqual(again.json, first.json);
  assert.equal((await repository.list()).length, 7);
  const other = await send(`${base}/v1/records`, { method: "POST", body: { ...NEW_EXPENSE, amountMinor: 999 }, headers: headers });
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
  assert.equal((await send(`${base}/v1/records/e-01`, { method: "POST", body: {} })).headers.get("allow"), "GET, PUT, PATCH, DELETE");
  assert.equal((await send(`${base}/v1/records/%E0`)).status, 400);
  assert.equal((await send(`${base}/records`)).status, 200); // the unversioned endpoint of the previous step
});

test("a failure inside is 500 INTERNAL with the request id and no stack", async (t) => {
  const repository = await freshRepository();
  const broken: ExpenseRepository = { ...repository, list: async () => { throw new TypeError("disk on fire"); } };
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
  const created = await send(`${base}/v1/records`, { method: "POST", body: NEW_EXPENSE });
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
