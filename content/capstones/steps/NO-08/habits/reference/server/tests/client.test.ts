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
import type { HabitRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import { createRecordsServer } from "../src/server.ts";
import { makeSyntheticHabits } from "../../data/synthetic.js";
import { ApiError } from "../../data/apiError.ts";
import { createHttpApi, InvalidResponseError } from "../../data/httpApi.ts";
import type { FetchFn } from "../../data/httpApi.ts";
import type { Habit } from "../../domain/habits.ts";
import { streakOf } from "../../ui/streak.ts";
import { parseErrorBodyV1, parseListPageV1, parseHabitV1 } from "../../shared/contract.ts";

const WEB_ORIGIN = "http://127.0.0.1:4310";

// The day the totals are counted on: a fixed day, never the clock (the last day of the starting habits).
const DAY = "2026-03-01";

function freshFolder(): string {
  return path.join(import.meta.dirname, "..", ".check", "client", randomUUID());
}

// The starting habits, and `extra` synthetic ones (ten days of completions each) with ids from h-101.
async function seeded(folder: string, extra = 0): Promise<HabitRepository> {
  const repository = createFileRepository(folder);
  await repository.seed(await loadFixtures());
  if (extra > 0) {
    await repository.upsertMany((makeSyntheticHabits(extra, 10) as Habit[]).map((habit, index) => ({ ...habit, id: `h-${101 + index}` })));
  }
  return repository;
}

// What the screens count from a list: every completion, and the streak of every habit on `day`.
function totals(list: Habit[], day: string) {
  return {
    completions: list.reduce((sum, habit) => sum + habit.completions.length, 0),
    streaks: Object.fromEntries(list.map((habit) => [habit.id, streakOf(habit.completions, day)])),
  };
}

async function startServer(t: TestContext, repository: HabitRepository) {
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

test("every page of GET /v1/records passes the shared contract, and the pages hold every habit once", async (t) => {
  const { base } = await startServer(t, await seeded(freshFolder(), 60));
  const ids: string[] = [];
  let cursor: string | null = null;
  do {
    const response: Response = await fetch(`${base}/v1/records?limit=50${cursor === null ? "" : "&cursor=" + cursor}`);
    assert.equal(response.status, 200);
    const page = parseListPageV1(await response.json());
    assert.ok(page.ok, JSON.stringify(page));
    ids.push(...page.value.items.map((habit) => habit.id));
    cursor = page.value.nextCursor;
  } while (cursor !== null);
  assert.equal(ids.length, 66);
  assert.equal(new Set(ids).size, 66);
});

test("the answers of POST, PATCH and POST …/completions and a refusal pass the shared contract", async (t) => {
  const { base } = await startServer(t, await seeded(freshFolder()));
  const json = { "content-type": "application/json" };
  const created = await fetch(`${base}/v1/records`, { method: "POST", headers: json, body: JSON.stringify({ name: "%%fixture6Name%% 2", frequency: "daily", active: true }) });
  assert.equal(created.status, 201);
  assert.ok(parseHabitV1(await created.json()).ok);
  const patched = await fetch(`${base}/v1/records/h-01`, { method: "PATCH", headers: json, body: JSON.stringify({ active: false }) });
  assert.ok(parseHabitV1(await patched.json()).ok);
  const marked = await fetch(`${base}/v1/records/h-06/completions`, { method: "POST", headers: json, body: JSON.stringify({ day: DAY }) });
  assert.equal(marked.status, 200);
  assert.ok(parseHabitV1(await marked.json()).ok);
  const refused = await fetch(`${base}/v1/records/h-01`, { method: "PATCH", headers: json, body: JSON.stringify({ active: "yes" }) });
  assert.equal(refused.status, 400);
  const body = parseErrorBodyV1(await refused.json());
  assert.ok(body.ok, JSON.stringify(body));
  assert.equal(body.value.error.code, "VALIDATION_FAILED");
});

test("the preflights of the web app's PATCH and POSTs: 204, its exact origin, the method and the headers, no credentials", async (t) => {
  const { base } = await startServer(t, await seeded(freshFolder()));
  const response = await fetch(`${base}/v1/records/h-01`, { method: "OPTIONS", headers: { origin: WEB_ORIGIN, "access-control-request-method": "PATCH", "access-control-request-headers": "content-type" } });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), WEB_ORIGIN);
  assert.match(response.headers.get("access-control-allow-methods") ?? "", /\bPATCH\b/);
  assert.match(response.headers.get("access-control-allow-headers") ?? "", /\bcontent-type\b/);
  assert.match(response.headers.get("vary") ?? "", /\bOrigin\b/);
  assert.equal(response.headers.get("access-control-allow-credentials"), null);
  const create = await fetch(`${base}/v1/records`, { method: "OPTIONS", headers: { origin: WEB_ORIGIN, "access-control-request-method": "POST", "access-control-request-headers": "content-type,idempotency-key" } });
  assert.match(create.headers.get("access-control-allow-methods") ?? "", /\bPOST\b/);
  assert.match(create.headers.get("access-control-allow-headers") ?? "", /\bidempotency-key\b/);
  const mark = await fetch(`${base}/v1/records/h-01/completions`, { method: "OPTIONS", headers: { origin: WEB_ORIGIN, "access-control-request-method": "POST", "access-control-request-headers": "content-type" } });
  assert.equal(mark.status, 204);
  assert.equal(mark.headers.get("access-control-allow-origin"), WEB_ORIGIN);
  assert.match(mark.headers.get("access-control-allow-methods") ?? "", /\bPOST\b/);
});

test("only the web app's origin is named; another origin gets no CORS answer, a request without Origin still works", async (t) => {
  const { base } = await startServer(t, await seeded(freshFolder()));
  const own = await fetch(`${base}/v1/records`, { headers: { origin: WEB_ORIGIN } });
  assert.equal(own.headers.get("access-control-allow-origin"), WEB_ORIGIN);
  const other = await fetch(`${base}/v1/records`, { headers: { origin: "http://127.0.0.1:4312" } });
  assert.equal(other.status, 200);
  assert.equal(other.headers.get("access-control-allow-origin"), null);
  assert.match(other.headers.get("vary") ?? "", /\bOrigin\b/);
  const otherPreflight = await fetch(`${base}/v1/records/h-01`, { method: "OPTIONS", headers: { origin: "http://127.0.0.1:4312", "access-control-request-method": "PATCH" } });
  assert.equal(otherPreflight.status, 204);
  assert.equal(otherPreflight.headers.get("access-control-allow-origin"), null);
  assert.equal(otherPreflight.headers.get("access-control-allow-methods"), null);
  assert.equal((await fetch(`${base}/v1/records`)).status, 200);
});

test("the HTTP source lists every habit across pages, filters on the server and the totals come from its list", async (t) => {
  const repository = await seeded(freshFolder(), 60);
  const { base } = await startServer(t, repository);
  const api = createHttpApi({ baseUrl: base, fetch: realFetch });
  const all = (await api.listHabits("all")) as Habit[];
  const stored = await repository.list();
  assert.deepEqual(all.map((habit) => habit.id).toSorted(), stored.map((habit) => habit.id).toSorted());
  assert.deepEqual(totals(all, DAY), totals(stored, DAY));
  const paused = (await api.listHabits("paused")) as Habit[];
  assert.ok(paused.length > 0 && paused.every((habit) => !habit.active));
  assert.equal(paused.length, stored.filter((habit) => !habit.active).length);
  const active = (await api.listHabits("active")) as Habit[];
  assert.ok(active.length > 0 && active.every((habit) => habit.active));
  assert.equal(active.length + paused.length, stored.length);
});

test("a day marked through the HTTP source survives a restart: a new server on the same folder answers it", async (t) => {
  const folder = freshFolder();
  const first = await startServer(t, await seeded(folder));
  const before = totals((await createHttpApi({ baseUrl: first.base, fetch: realFetch }).listHabits("all")) as Habit[], DAY);
  await createHttpApi({ baseUrl: first.base, fetch: realFetch }).addCompletion("h-06", DAY);
  await first.stop();
  const second = await startServer(t, createFileRepository(folder));
  const after = (await createHttpApi({ baseUrl: second.base, fetch: realFetch }).listHabits("all")) as Habit[];
  assert.deepEqual(after.find((habit) => habit.id === "h-06")?.completions, [DAY]);
  // The streak of the fixed day is counted from the server's completions: 0 before, 1 after.
  assert.equal(before.streaks["h-06"], 0);
  assert.equal(totals(after, DAY).streaks["h-06"], 1);
  assert.equal(totals(after, DAY).completions, before.completions + 1);
});

test("a save through the HTTP source changes the fields and keeps every marked day of the habit", async (t) => {
  const repository = await seeded(freshFolder());
  const { base } = await startServer(t, repository);
  const before = await repository.get("h-01");
  await createHttpApi({ baseUrl: base, fetch: realFetch }).saveHabit("h-01", { name: "%%fixture1Name%%", frequency: "weekly", active: false });
  const after = await repository.get("h-01");
  assert.equal(after?.frequency, "weekly");
  assert.equal(after?.active, false);
  assert.deepEqual(after?.completions, before?.completions);
});

test("a refused change rejects with its status and the server's habit stays as it was", async (t) => {
  const repository = await seeded(freshFolder());
  const { base } = await startServer(t, repository);
  const api = createHttpApi({ baseUrl: base, fetch: realFetch });
  const before = await repository.get("h-01");
  await assert.rejects(api.saveHabit("h-01", { name: "", frequency: "daily", active: true }), (error: unknown) => error instanceof ApiError && error.status === 400);
  await assert.rejects(api.addCompletion("h-01", "2026-02-30"), (error: unknown) => error instanceof ApiError && error.status === 400);
  await assert.rejects(api.addCompletion("h-99", DAY), (error: unknown) => error instanceof ApiError && error.status === 404);
  assert.deepEqual(await repository.get("h-01"), before);
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
  await createHttpApi({ baseUrl: base, fetch: losingFetch }).createHabit({ name: "%%fixture6Name%% 2", frequency: "daily", active: true });
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
  await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: down }).listHabits("all"), TypeError);
  assert.equal(calls, 3);
  calls = 0;
  const refusing: FetchFn = async () => {
    calls += 1;
    return new Response(JSON.stringify({ error: { code: "VALIDATION_FAILED", messageKey: "errors.validationFailed", details: { limit: "out-of-range" }, requestId: "r-1" } }), { status: 400 });
  };
  await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: refusing }).listHabits("all"), (error: unknown) => error instanceof ApiError && error.status === 400);
  assert.equal(calls, 1);
});

test("an answer of the wrong shape is refused, not shown", async () => {
  const wrong: FetchFn = async () => new Response(JSON.stringify({ items: [{ id: "h-01", name: "%%fixture1Name%%", frequency: "often", active: true, completions: [] }], nextCursor: null }), { status: 200 });
  await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: wrong }).listHabits("all"), InvalidResponseError);
  const flat: FetchFn = async () => new Response("[]", { status: 200 });
  await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: flat }).listHabits("all"), InvalidResponseError);
  const halfHabit: FetchFn = async () => new Response(JSON.stringify({ id: "h-01", completions: [DAY] }), { status: 200 });
  await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: halfHabit }).addCompletion("h-01", DAY), InvalidResponseError);
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
    await assert.rejects(createHttpApi({ baseUrl: "http://127.0.0.1:9", fetch: hanging, timeoutMs: 50 }).listHabits("all"), (error: unknown) => error instanceof Error && error.name === "TimeoutError");
  } finally {
    clearInterval(keepAlive);
  }
  assert.equal(calls, 3);
});
