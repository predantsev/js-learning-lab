// Tests of the web client's side of the records API — `npm test` in server/. The real server runs on
// 127.0.0.1 and a port the system picks; the web client's HTTP source (../../data/httpApi.ts) and the shared
// contract (../../shared/contract.ts) are imported as they are, so these tests check the same code the
// browser runs. What a browser does with CORS headers is not checked here (Node's fetch ignores CORS):
// the tests check the headers the browser relies on; the browser itself is checked by hand (docs/server.md).
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
import { makeSyntheticExpenses } from "../../data/synthetic.js";
import { ApiError } from "../../data/apiError.ts";
import { createHttpApi, InvalidResponseError } from "../../data/httpApi.ts";
import type { FetchFn } from "../../data/httpApi.ts";
import { totalsByCategory } from "../../domain/expenses.ts";
import type { CategoryId, Expense } from "../../domain/expenses.ts";
import { parseErrorBodyV1, parseExpenseV1, parseListPageV1 } from "../../shared/contract.ts";

const WEB_ORIGIN = "http://127.0.0.1:4310";

function freshFolder(): string {
  return path.join(import.meta.dirname, "..", ".check", "client", randomUUID());
}

// The starting expenses, and `extra` synthetic ones with ids from e-101.
async function seeded(folder: string, extra = 0): Promise<ExpenseRepository> {
  const repository = createFileRepository(folder);
  await repository.seed(await loadFixtures());
  if (extra > 0) {
    await repository.upsertMany(makeSyntheticExpenses(extra).map((expense, index) => ({ ...expense, id: `e-${101 + index}`, category: expense.category as CategoryId })));
  }
  return repository;
}

async function startServer(t: TestContext, repository: ExpenseRepository) {
  const server = createRecordsServer(repository, () => {});
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const stop = () => {
    server.closeAllConnections();
    return new Promise<void>((resolve) => server.close(() => resolve()));
  };
  t.after(() => (server.listening ? stop() : undefined));
  return { base: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, stop: stop };
}

const realFetch: FetchFn = (url, init) => fetch(url, init);

// The totals per category in amountMinor, as a plain object: the order of the list does not matter.
function totals(list: Expense[]): Record<string, number> {
  return Object.fromEntries(totalsByCategory(list));
}

test("every page of GET /v1/records passes the shared contract, and the pages hold every expense once", async (t) => {
  const { base } = await startServer(t, await seeded(freshFolder(), 60));
  const ids: string[] = [];
  let cursor: string | null = null;
  do {
    const response: Response = await fetch(`${base}/v1/records?limit=50${cursor === null ? "" : "&cursor=" + cursor}`);
    assert.equal(response.status, 200);
    const page = parseListPageV1(await response.json());
    assert.ok(page.ok, JSON.stringify(page));
    ids.push(...page.value.items.map((expense) => expense.id));
    cursor = page.value.nextCursor;
  } while (cursor !== null);
  assert.equal(ids.length, 66);
  assert.equal(new Set(ids).size, 66);
});

test("the answers of POST and PATCH and a refusal pass the shared contract", async (t) => {
  const { base } = await startServer(t, await seeded(freshFolder()));
  const json = { "content-type": "application/json" };
  const created = await fetch(`${base}/v1/records`, { method: "POST", headers: json, body: JSON.stringify({ label: "%%fixture6Name%%", amountMinor: 21050, date: "2026-03-03", category: "food" }) });
  assert.equal(created.status, 201);
  assert.ok(parseExpenseV1(await created.json()).ok);
  const patched = await fetch(`${base}/v1/records/e-01`, { method: "PATCH", headers: json, body: JSON.stringify({ amountMinor: 90000 }) });
  assert.ok(parseExpenseV1(await patched.json()).ok);
  const refused = await fetch(`${base}/v1/records/e-01`, { method: "PATCH", headers: json, body: JSON.stringify({ amountMinor: "yes" }) });
  assert.equal(refused.status, 400);
  const body = parseErrorBodyV1(await refused.json());
  assert.ok(body.ok, JSON.stringify(body));
  assert.equal(body.value.error.code, "VALIDATION_FAILED");
});

test("the preflights of the web app's DELETE, POST and PUT: 204, its exact origin, the method and the headers, no credentials", async (t) => {
  const { base } = await startServer(t, await seeded(freshFolder()));
  const response = await fetch(`${base}/v1/records/e-01`, { method: "OPTIONS", headers: { origin: WEB_ORIGIN, "access-control-request-method": "DELETE" } });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), WEB_ORIGIN);
  assert.match(response.headers.get("access-control-allow-methods") ?? "", /\bDELETE\b/);
  assert.match(response.headers.get("vary") ?? "", /\bOrigin\b/);
  assert.equal(response.headers.get("access-control-allow-credentials"), null);
  const create = await fetch(`${base}/v1/records`, { method: "OPTIONS", headers: { origin: WEB_ORIGIN, "access-control-request-method": "POST", "access-control-request-headers": "content-type,idempotency-key" } });
  assert.match(create.headers.get("access-control-allow-methods") ?? "", /\bPOST\b/);
  assert.match(create.headers.get("access-control-allow-headers") ?? "", /\bcontent-type\b/);
  assert.match(create.headers.get("access-control-allow-headers") ?? "", /\bidempotency-key\b/);
  const save = await fetch(`${base}/v1/records/e-01`, { method: "OPTIONS", headers: { origin: WEB_ORIGIN, "access-control-request-method": "PUT", "access-control-request-headers": "content-type" } });
  assert.match(save.headers.get("access-control-allow-methods") ?? "", /\bPUT\b/);
  assert.match(save.headers.get("access-control-allow-headers") ?? "", /\bcontent-type\b/);
});

test("only the web app's origin is named; another origin gets no CORS answer, a request without Origin still works", async (t) => {
  const { base } = await startServer(t, await seeded(freshFolder()));
  const own = await fetch(`${base}/v1/records`, { headers: { origin: WEB_ORIGIN } });
  assert.equal(own.headers.get("access-control-allow-origin"), WEB_ORIGIN);
  const other = await fetch(`${base}/v1/records`, { headers: { origin: "http://127.0.0.1:4312" } });
  assert.equal(other.status, 200);
  assert.equal(other.headers.get("access-control-allow-origin"), null);
  assert.match(other.headers.get("vary") ?? "", /\bOrigin\b/);
  const otherPreflight = await fetch(`${base}/v1/records/e-01`, { method: "OPTIONS", headers: { origin: "http://127.0.0.1:4312", "access-control-request-method": "DELETE" } });
  assert.equal(otherPreflight.status, 204);
  assert.equal(otherPreflight.headers.get("access-control-allow-origin"), null);
  assert.equal(otherPreflight.headers.get("access-control-allow-methods"), null);
  assert.equal((await fetch(`${base}/v1/records`)).status, 200);
});

test("the HTTP source lists every expense across pages, filters on the server and the totals come from its list", async (t) => {
  const repository = await seeded(freshFolder(), 60);
  const { base } = await startServer(t, repository);
  const api = createHttpApi({ baseUrl: base, fetch: realFetch });
  const all = (await api.listExpenses("all")) as Expense[];
  const stored = await repository.list();
  assert.deepEqual(all.map((expense) => expense.id).toSorted(), stored.map((expense) => expense.id).toSorted());
  assert.deepEqual(totals(all), totals(stored));
  const food = (await api.listExpenses("food")) as Expense[];
  assert.ok(food.length > 0 && food.every((expense) => expense.category === "food"));
  assert.equal(food.length, stored.filter((expense) => expense.category === "food").length);
});

test("an expense created through the HTTP source survives a restart: its category total grows by exactly its amountMinor", async (t) => {
  const folder = freshFolder();
  const first = await startServer(t, await seeded(folder));
  const listed = (await createHttpApi({ baseUrl: first.base, fetch: realFetch }).listExpenses("all")) as Expense[];
  const before = totals(listed);
  await createHttpApi({ baseUrl: first.base, fetch: realFetch }).createExpense({ label: "%%fixture6Name%%", amountMinor: 12345, date: "2026-03-03", category: "food" });
  await first.stop();
  const second = await startServer(t, createFileRepository(folder));
  const after = (await createHttpApi({ baseUrl: second.base, fetch: realFetch }).listExpenses("all")) as Expense[];
  const added = after.filter((expense) => !listed.some((one) => one.id === expense.id));
  assert.equal(added.length, 1);
  assert.deepEqual({ ...added[0], id: "" }, { id: "", label: "%%fixture6Name%%", amountMinor: 12345, date: "2026-03-03", category: "food" });
  assert.deepEqual(totals(after), { ...before, food: before.food + 12345 });
});

test("an expense deleted through the HTTP source stays deleted after a restart: its category total drops by exactly its amountMinor", async (t) => {
  const folder = freshFolder();
  const first = await startServer(t, await seeded(folder));
  const listed = (await createHttpApi({ baseUrl: first.base, fetch: realFetch }).listExpenses("all")) as Expense[];
  const e01 = listed.find((expense) => expense.id === "e-01");
  assert.ok(e01 !== undefined);
  await createHttpApi({ baseUrl: first.base, fetch: realFetch }).deleteExpense("e-01");
  await first.stop();
  const second = await startServer(t, createFileRepository(folder));
  const after = (await createHttpApi({ baseUrl: second.base, fetch: realFetch }).listExpenses("all")) as Expense[];
  assert.deepEqual(after.map((expense) => expense.id).toSorted(), listed.map((expense) => expense.id).filter((id) => id !== "e-01").toSorted());
  const before = totals(listed);
  assert.equal(totals(after)[e01.category], before[e01.category] - e01.amountMinor);
});

test("a refused change rejects with its status and the server's expense stays as it was", async (t) => {
  const repository = await seeded(freshFolder());
  const { base } = await startServer(t, repository);
  const api = createHttpApi({ baseUrl: base, fetch: realFetch });
  const before = await repository.get("e-01");
  await assert.rejects(api.saveExpense("e-01", { label: "", amountMinor: 84550, date: "2026-03-01", category: "food" }), (error: unknown) => error instanceof ApiError && error.status === 400);
  await assert.rejects(api.saveExpense("e-99", { label: "%%fixture6Name%%", amountMinor: 21050, date: "2026-03-02", category: "food" }), (error: unknown) => error instanceof ApiError && error.status === 404);
  await assert.rejects(api.deleteExpense("e-99"), (error: unknown) => error instanceof ApiError && error.status === 404);
  assert.deepEqual(await repository.get("e-01"), before);
  assert.equal((await repository.list()).length, 6);
});

test("a create whose answer was lost is sent again with the same Idempotency-Key and stored once", async (t) => {
  const repository = await seeded(freshFolder());
  const { base } = await startServer(t, repository);
  const keys: (string | null)[] = [];
  let lost = false;
  const losingFetch: FetchFn = async (url, init) => {
    const response = await fetch(url, init);
    if (init?.method === "POST") {
      keys.push(new Headers(init.headers).get("idempotency-key"));
      if (!lost) {
        lost = true;
        await response.text();
        throw new TypeError("fetch failed");
      }
    }
    return response;
  };
  await createHttpApi({ baseUrl: base, fetch: losingFetch }).createExpense({ label: "%%fixture6Name%%", amountMinor: 21050, date: "2026-03-03", category: "food" });
  assert.equal(keys.length, 2);
  assert.ok(keys[0] !== null && keys[0] === keys[1]);
  assert.equal((await repository.list()).length, 7);
});

test("a read is tried three times when nothing answers, a 4xx once, and every failure rejects", async () => {
  let calls = 0;
  const down: FetchFn = async () => {
    calls += 1;
    throw new TypeError("fetch failed");
  };
  await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: down }).listExpenses("all"), TypeError);
  assert.equal(calls, 3);
  calls = 0;
  const refusing: FetchFn = async () => {
    calls += 1;
    return new Response(JSON.stringify({ error: { code: "VALIDATION_FAILED", messageKey: "errors.validationFailed", details: { limit: "out-of-range" }, requestId: "r-1" } }), { status: 400 });
  };
  await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: refusing }).listExpenses("all"), (error: unknown) => error instanceof ApiError && error.status === 400);
  assert.equal(calls, 1);
});

test("an answer of the wrong shape is refused, not shown", async () => {
  const wrong: FetchFn = async () => new Response(JSON.stringify({ items: [{ id: "e-01", label: "%%fixture1Name%%", amountMinor: "84550", date: "2026-03-01", category: "food" }], nextCursor: null }), { status: 200 });
  await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: wrong }).listExpenses("all"), InvalidResponseError);
  const flat: FetchFn = async () => new Response("[]", { status: 200 });
  await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: flat }).listExpenses("all"), InvalidResponseError);
  const halfExpense: FetchFn = async () => new Response(JSON.stringify({ id: "e-01", amountMinor: 84550 }), { status: 200 });
  await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: halfExpense }).saveExpense("e-01", { label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" }), InvalidResponseError);
});

test("a server that does not answer in time is given up with a TimeoutError after the bounded retries", async () => {
  let calls = 0;
  const hanging: FetchFn = (url, init) => {
    calls += 1;
    return new Promise((resolve, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)));
  };
  // AbortSignal.timeout's timer does not keep Node running by itself (Node 22.13 then cancels the test as
  // finished with work still pending), so an ordinary timer keeps the process alive while the test waits.
  const keepAlive = setInterval(() => {}, 1000);
  try {
    await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: hanging, timeoutMs: 50 }).listExpenses("all"), (error: unknown) => error instanceof Error && error.name === "TimeoutError");
  } finally {
    clearInterval(keepAlive);
  }
  assert.equal(calls, 3);
});
