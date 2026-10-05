// Tests of the /v1 records API with node:test, over real HTTP on 127.0.0.1 and a port the system picks
// (listen(0)): `npm test` in server/. Every test gets its own data folder under server/.check/, seeded
// with the web project's starting habits, and its own server, closed in t.after.
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { createFileRepository } from "../src/fileRepository.ts";
import type { HabitRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import { createRecordsServer } from "../src/server.ts";

async function freshRepository(): Promise<HabitRepository> {
  const repository = createFileRepository(path.join(import.meta.dirname, "..", ".check", "api", randomUUID()));
  await repository.seed(await loadFixtures());
  return repository;
}

async function startServer(t: TestContext, repository: HabitRepository): Promise<string> {
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

const NEW_HABIT = { name: "%%fixture1Name%% 2", frequency: "weekly" };

test("create, read, replace, patch, delete and a 404 after it", async (t) => {
  const base = await startServer(t, await freshRepository());
  const created = await send(`${base}/v1/records`, { method: "POST", body: NEW_HABIT });
  assert.equal(created.status, 201);
  assert.deepEqual(created.json, { id: "h-07", name: "%%fixture1Name%% 2", frequency: "weekly", active: true, completions: [] });
  assert.deepEqual((await send(`${base}/v1/records/h-07`)).json, created.json);
  const replaced = await send(`${base}/v1/records/h-07`, { method: "PUT", body: { name: "%%fixture1Name%% 3", completions: ["2026-03-01"] } });
  assert.equal(replaced.status, 200);
  assert.deepEqual(replaced.json, { id: "h-07", name: "%%fixture1Name%% 3", frequency: "daily", active: true, completions: ["2026-03-01"] });
  const patched = await send(`${base}/v1/records/h-07`, { method: "PATCH", body: { active: false } });
  assert.equal(patched.status, 200);
  assert.deepEqual(patched.json, { ...replaced.json, active: false });
  assert.equal((await send(`${base}/v1/records/h-07`, { method: "DELETE" })).status, 204);
  const gone = await send(`${base}/v1/records/h-07`);
  assert.equal(gone.status, 404);
  assert.equal(gone.json.error.code, "NOT_FOUND");
});

test("an invalid create names every field and stores nothing", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const answer = await send(`${base}/v1/records`, { method: "POST", body: { name: "", frequency: "monthly", completions: ["2026-03-02", "2026-03-01"], isAdmin: true } });
  assert.equal(answer.status, 400);
  assert.equal(answer.json.error.code, "VALIDATION_FAILED");
  assert.deepEqual(answer.json.error.details, { name: "required", frequency: "unknown", completions: "not-unique-ascending", isAdmin: "unknown-field" });
  assert.equal((await repository.list()).length, 6);
});

test("completions are calendar dates, each once, ascending; the other domain rules hold too", async (t) => {
  const base = await startServer(t, await freshRepository());
  const post = async (body: unknown) => (await send(`${base}/v1/records`, { method: "POST", body: body })).json.error.details;
  assert.deepEqual(await post({ name: "%%fixture1Name%%", completions: ["2026-3-1"] }), { completions: "bad-date" });
  assert.deepEqual(await post({ name: "%%fixture1Name%%", completions: ["2026-03-01", "2026-03-01"] }), { completions: "not-unique-ascending" });
  assert.deepEqual(await post({ name: "%%fixture1Name%%", completions: "2026-03-01" }), { completions: "bad-date" });
  assert.deepEqual(await post({ name: "%%fixture1Name%%", active: "yes" }), { active: "not-a-boolean" });
  assert.deepEqual(await post({ name: "a".repeat(81) }), { name: "too-long" });
  assert.equal((await send(`${base}/v1/records`, { method: "POST", body: { name: "a".repeat(80), completions: ["2026-02-28", "2026-03-01"] } })).status, 201);
});

test("an invalid PATCH changes nothing, and the list still sorts", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const before = await repository.get("h-01");
  const answer = await send(`${base}/v1/records/h-01`, { method: "PATCH", body: { completions: ["2026-03-01", "2026-02-27"], name: null } });
  assert.equal(answer.status, 400);
  assert.deepEqual(answer.json.error.details, { name: "not-a-string", completions: "not-unique-ascending" });
  assert.deepEqual(await repository.get("h-01"), before);
  assert.equal((await send(`${base}/v1/records`)).status, 200);
  assert.deepEqual((await send(`${base}/v1/records/h-01`, { method: "PATCH", body: { id: "h-99" } })).json.error.details, { id: "unknown-field" });
});

test("a retried 'done today' leaves a single entry, in date order", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const url = `${base}/v1/records/h-03/completions`;
  const first = await send(url, { method: "POST", body: { day: "2026-03-02" } });
  const again = await send(url, { method: "POST", body: { day: "2026-03-02" } });
  assert.equal(first.status, 200);
  assert.deepEqual(again.json, first.json);
  assert.deepEqual((await repository.get("h-03"))?.completions, ["2026-03-01", "2026-03-02"]);
  await send(url, { method: "POST", body: { day: "2026-02-28" } });
  assert.deepEqual((await repository.get("h-03"))?.completions, ["2026-02-28", "2026-03-01", "2026-03-02"]);
  assert.deepEqual((await send(url, { method: "POST", body: { day: "2026-3-2" } })).json.error.details, { day: "bad-date" });
  assert.equal((await send(`${base}/v1/records/h-99/completions`, { method: "POST", body: { day: "2026-03-02" } })).status, 404);
  assert.equal((await send(url)).headers.get("allow"), "POST");
});

test("every habit exactly once across the pages, in the order of the names", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const { ids, pages } = await allPages(base, "limit=4");
  const names = new Map((await repository.list()).map((habit) => [habit.id, habit.name]));
  const expected = [...names.keys()].toSorted((a, b) => names.get(a)!.localeCompare(names.get(b)!, "uk") || (a < b ? -1 : 1));
  assert.deepEqual(ids, expected);
  assert.equal(pages, 2);
});

test("habits with the same name are not lost at a page boundary (the id breaks the tie)", async (t) => {
  const base = await startServer(t, await freshRepository());
  for (let count = 0; count < 3; count += 1) {
    await send(`${base}/v1/records`, { method: "POST", body: { name: "%%fixture1Name%%" } });
  }
  const { ids } = await allPages(base, "sort=name&limit=2");
  assert.equal(ids.length, 9);
  assert.equal(new Set(ids).size, 9);
  const same = ids.filter((id) => ["h-01", "h-07", "h-08", "h-09"].includes(id));
  assert.deepEqual(same, ["h-01", "h-07", "h-08", "h-09"]);
});

test("filters by active, and a page that ends at the last habit has nextCursor null", async (t) => {
  const base = await startServer(t, await freshRepository());
  assert.deepEqual((await allPages(base, "active=false")).ids, ["h-05"]);
  const active = await send(`${base}/v1/records?active=true&limit=5`);
  assert.equal(active.json.items.length, 5);
  assert.equal(active.json.nextCursor, null);
});

test("an unknown cursor, a bad limit, sort or filter are 400 with a reason", async (t) => {
  const base = await startServer(t, await freshRepository());
  assert.deepEqual((await send(`${base}/v1/records?cursor=h-99`)).json.error.details, { cursor: "unknown-cursor" });
  for (const limit of ["0", "51", "abc", "1e1"]) {
    assert.deepEqual((await send(`${base}/v1/records?limit=${limit}`)).json.error.details, { limit: "out-of-range" }, limit);
  }
  assert.deepEqual((await send(`${base}/v1/records?sort=frequency`)).json.error.details, { sort: "unknown-sort" });
  assert.deepEqual((await send(`${base}/v1/records?active=yes`)).json.error.details, { active: "not-a-boolean" });
});

test("malformed JSON is 400 MALFORMED_JSON and a body over 4096 bytes is 413", async (t) => {
  const base = await startServer(t, await freshRepository());
  const broken = await send(`${base}/v1/records`, { method: "POST", raw: '{"x": "unfinish' });
  assert.equal(broken.status, 400);
  assert.equal(broken.json.error.code, "MALFORMED_JSON");
  const big = await send(`${base}/v1/records`, { method: "POST", body: { ...NEW_HABIT, note: "x".repeat(5000) } });
  assert.equal(big.status, 413);
  assert.equal(big.json.error.code, "PAYLOAD_TOO_LARGE");
});

test("a retried POST with the same Idempotency-Key creates one habit", async (t) => {
  const repository = await freshRepository();
  const base = await startServer(t, repository);
  const headers = { "idempotency-key": "k-1" };
  const first = await send(`${base}/v1/records`, { method: "POST", body: NEW_HABIT, headers: headers });
  const again = await send(`${base}/v1/records`, { method: "POST", body: NEW_HABIT, headers: headers });
  assert.equal(first.status, 201);
  assert.equal(again.status, 201);
  assert.deepEqual(again.json, first.json);
  assert.equal((await repository.list()).length, 7);
  const other = await send(`${base}/v1/records`, { method: "POST", body: { ...NEW_HABIT, name: "%%fixture1Name%% 4" }, headers: headers });
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
  assert.equal((await send(`${base}/v1/records/h-01`, { method: "POST", body: {} })).headers.get("allow"), "GET, PUT, PATCH, DELETE");
  assert.equal((await send(`${base}/v1/records/%E0`)).status, 400);
  assert.equal((await send(`${base}/records`)).status, 200); // the unversioned endpoint of the previous step
});

test("a failure inside is 500 INTERNAL with the request id and no stack", async (t) => {
  const repository = await freshRepository();
  const broken: HabitRepository = { ...repository, list: async () => { throw new TypeError("disk on fire"); } };
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
  const created = await send(`${base}/v1/records`, { method: "POST", body: NEW_HABIT });
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
