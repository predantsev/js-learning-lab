// Tests of the streamed export and import over real HTTP and on real files: JSON lines out, backpressure,
// a temp file that never survives an abort, an import of 10,000 synthetic habits that a retry never
// duplicates, completions merged so that a retry never counts a day twice and a day completed in between
// stays, every line checked with its number (the edge rules of real days and MAX_COMPLETIONS too), the
// job's budget, a client that goes away, a busy import queue and a retried write.
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { Writable } from "node:stream";
import { dayAfterStart, makeSyntheticHabits } from "../../data/synthetic.js";
import type { Habit } from "../../domain/habits.ts";
import { createFileRepository } from "../src/fileRepository.ts";
import type { HabitRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import type { ImportLimits } from "../src/importer.ts";
import { exportToFile, habitLine, writeJsonLines } from "../src/jsonl.ts";
import { createRecordsServer } from "../src/server.ts";
import { MAX_COMPLETIONS } from "../src/validate.ts";

// The synthetic habits with ids h-101, h-102, …: a month of completions by default, as `npm run synth` writes.
const synthetic = (count: number, days = 30): Habit[] => (makeSyntheticHabits(count, days) as Habit[]).map((habit, index) => ({ ...habit, id: `h-${101 + index}` }));
const linesOf = (habits: Habit[]) => habits.map(habitLine).join("");
const daysFrom = (first: number, count: number): string[] => Array.from({ length: count }, (_, index) => dayAfterStart(first + index));

async function freshRepository(): Promise<HabitRepository> {
  const repository = createFileRepository(path.join(import.meta.dirname, "..", ".check", "streams", randomUUID()));
  await repository.seed(await loadFixtures());
  return repository;
}

async function startServer(t: TestContext, repository: HabitRepository, importLimits: Partial<ImportLimits> = {}): Promise<{ base: string; port: number }> {
  const server = createRecordsServer(repository, () => {}, {}, importLimits);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const { port } = server.address() as AddressInfo;
  return { base: `http://127.0.0.1:${port}`, port: port };
}

async function postImport(base: string, body: string) {
  const response = await fetch(`${base}/v1/import`, { method: "POST", headers: { "content-type": "application/x-ndjson" }, body: body, signal: AbortSignal.timeout(10_000) });
  return { status: response.status, headers: response.headers, json: await response.json() };
}

async function completeDay(base: string, id: string, day: string): Promise<number> {
  const response = await fetch(`${base}/v1/records/${id}/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ day: day }), signal: AbortSignal.timeout(2000) });
  await response.text();
  return response.status;
}

// id → completions of every stored habit.
async function completionsById(repository: HabitRepository): Promise<Map<string, string[]>> {
  return new Map((await repository.list()).map((habit) => [habit.id, habit.completions]));
}

test("GET /v1/export streams every habit as one JSON line, fields in a fixed order", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const response = await fetch(`${base}/v1/export`, { signal: AbortSignal.timeout(2000) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^application\/x-ndjson/);
  const text = await response.text();
  assert.equal(text, linesOf(await repository.list()));
  assert.deepEqual(Object.keys(JSON.parse(text.split("\n")[0])), ["id", "name", "frequency", "active", "completions"]);
});

test("writeJsonLines waits for 'drain': the writer's queue never holds more than its limit plus one line", async () => {
  const written: string[] = [];
  let biggestQueue = 0;
  const slow = new Writable({
    highWaterMark: 256,
    write(chunk, _encoding, done) {
      written.push(String(chunk));
      setTimeout(done, 1);
    },
  });
  const lines = synthetic(300).map(habitLine);
  const longest = Math.max(...lines.map((line) => Buffer.byteLength(line)));
  const watch = setInterval(() => (biggestQueue = Math.max(biggestQueue, slow.writableLength)), 0);
  const original = slow.write.bind(slow);
  slow.write = ((chunk: string) => {
    const answer = original(chunk);
    biggestQueue = Math.max(biggestQueue, slow.writableLength);
    return answer;
  }) as typeof slow.write;
  await writeJsonLines(lines, slow);
  clearInterval(watch);
  assert.ok(biggestQueue <= 256 + longest, `the queue held ${biggestQueue} bytes`);
  slow.end();
  await new Promise((resolve) => slow.on("finish", resolve));
  assert.equal(written.join(""), lines.join(""));
});

test("an aborted export to a file leaves the older file as it was and no temp file", async () => {
  const dir = path.join(import.meta.dirname, "..", ".check", "streams", randomUUID());
  await mkdir(dir, { recursive: true });
  const dest = path.join(dir, "export.jsonl");
  await writeFile(dest, "older export\n");
  const controller = new AbortController();
  const exporting = exportToFile(synthetic(5000), dest, controller.signal);
  controller.abort();
  await assert.rejects(exporting, { name: "AbortError" });
  assert.equal(await readFile(dest, "utf8"), "older export\n");
  assert.deepEqual(await readdir(dir), ["export.jsonl"]);
  await exportToFile(synthetic(3), dest);
  assert.equal(await readFile(dest, "utf8"), linesOf(synthetic(3)));
});

test("10,000 synthetic habits import once; the same file imported again duplicates nothing", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const habits = synthetic(10_000);
  const body = linesOf(habits);
  const first = await postImport(base, body);
  assert.equal(first.status, 200);
  assert.deepEqual(first.json, { lines: 10_000, created: 10_000, updated: 0 });
  const again = await postImport(base, body);
  assert.deepEqual(again.json, { lines: 10_000, created: 0, updated: 10_000 });
  const stored = await repository.list();
  assert.equal(stored.length, 10_006);
  assert.equal(new Set(stored.map((habit) => habit.id)).size, 10_006);
  assert.deepEqual(stored.slice(6), habits);
  const exported = await (await fetch(`${base}/v1/export`, { signal: AbortSignal.timeout(5000) })).text();
  assert.equal(exported.split("\n").filter((line) => line !== "").length, 10_006);
});

test("an import is an upsert by id: a known id takes the line's fields in its place and keeps the union of completions", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const changed: Habit = { id: "h-02", name: "%%fixture2Name%% (new)", frequency: "weekly", active: false, completions: ["2026-02-28", "2026-03-02"] };
  const added: Habit = { id: "h-07", name: "%%fixture3Name%% 2", frequency: "daily", active: true, completions: ["2026-03-01"] };
  const answer = await postImport(base, habitLine(changed) + habitLine(added));
  assert.deepEqual(answer.json, { lines: 2, created: 1, updated: 1 });
  const stored = await repository.list();
  assert.deepEqual(stored.map((habit) => habit.id), ["h-01", "h-02", "h-03", "h-04", "h-05", "h-06", "h-07"]);
  assert.deepEqual(stored[1], { ...changed, completions: ["2026-02-26", "2026-02-28", "2026-03-01", "2026-03-02"] });
  assert.deepEqual(stored[6], added);
});

test("a retried import never double-counts a completion: the same file twice keeps every habit's completions count", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  // h-01 is stored with 2026-02-27, 2026-02-28 and 2026-03-01; the file repeats one of them and adds one.
  const body = linesOf(synthetic(200)) + habitLine({ id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-28", "2026-03-02"] });
  assert.equal((await postImport(base, body)).status, 200);
  const once = await completionsById(repository);
  assert.deepEqual(once.get("h-01"), ["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
  const again = await postImport(base, body);
  assert.equal(again.status, 200);
  assert.deepEqual(again.json, { lines: 201, created: 0, updated: 201 });
  const twice = await completionsById(repository);
  assert.equal(twice.size, once.size);
  for (const [id, days] of once) {
    assert.equal(twice.get(id)!.length, days.length, `${id} completions count`);
    assert.deepEqual(twice.get(id), days, id);
  }
});

test("a day completed between two imports of the same file is kept", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const habits = synthetic(50);
  const body = linesOf(habits) + habitLine({ id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-27"] });
  assert.equal((await postImport(base, body)).status, 200);
  assert.equal(await completeDay(base, "h-101", "2026-03-05"), 200);
  assert.equal(await completeDay(base, "h-01", "2026-03-05"), 200);
  assert.equal((await postImport(base, body)).status, 200);
  const stored = await completionsById(repository);
  assert.deepEqual(stored.get("h-101"), [...habits[0].completions, "2026-03-05"]);
  assert.deepEqual(stored.get("h-01"), ["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-05"]);
  assert.deepEqual(stored.get("h-102"), habits[1].completions);
});

test("a merge that would take a habit past MAX_COMPLETIONS refuses the whole import", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const before = await readFile(repository.file, "utf8");
  // h-01 holds 3 days in 2026; MAX_COMPLETIONS − 1 earlier days make a union of MAX_COMPLETIONS + 2.
  const tooLong: Habit = { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: daysFrom(0, MAX_COMPLETIONS - 1) };
  const answer = await postImport(base, linesOf(synthetic(3)) + habitLine(tooLong));
  assert.equal(answer.status, 400);
  assert.equal(answer.json.error.code, "VALIDATION_FAILED");
  assert.deepEqual(answer.json.error.details, { completions: "too-many", ids: ["h-01"] });
  assert.equal(await readFile(repository.file, "utf8"), before);
});

test("every line is checked and named by its number; one bad line and nothing is written", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const before = await readFile(repository.file, "utf8");
  const good = synthetic(5, 7).map(habitLine);
  const line = (fields: object) => JSON.stringify({ id: "h-901", name: "x", frequency: "daily", active: true, completions: [], ...fields }) + "\n";
  const body = [
    good[0],
    "\n",
    line({ completions: ["2026-02-28", "2026-02-30"] }),
    good[1],
    "{not json\n",
    good[2],
    line({ id: "../h-01" }),
    good[3],
    line({ id: "h-902", isAdmin: true }),
    good[0],
    line({ id: "h-903", completions: ["2026-03-02", "2026-03-01"] }),
    line({ id: "h-904", completions: daysFrom(0, MAX_COMPLETIONS + 1) }),
    line({ id: "h-905", frequency: "monthly" }),
    line({ id: "h-906", completions: ["2026-03-01", "2026-03-01"] }),
    good[4],
  ].join("");
  const answer = await postImport(base, body);
  assert.equal(answer.status, 400);
  assert.equal(answer.json.error.code, "VALIDATION_FAILED");
  assert.deepEqual(answer.json.error.details, {
    "line 3": "completions: bad-date",
    "line 5": "not-json",
    "line 7": "id: malformed",
    "line 9": "isAdmin: unknown",
    "line 10": "id: duplicate",
    "line 11": "completions: notSorted",
    "line 12": "completions: too-many",
    "line 13": "frequency: unknown",
    "line 14": "completions: duplicateDate",
  });
  assert.equal(await readFile(repository.file, "utf8"), before);
  // A habit of exactly MAX_COMPLETIONS real days fits on one line and passes.
  const full = await postImport(base, line({ completions: daysFrom(0, MAX_COMPLETIONS) }));
  assert.deepEqual(full.json, { lines: 1, created: 1, updated: 0 });
});

test("the job's budget: more lines than maxRecords, or one line over maxLineBytes, is 413 and nothing is written", async (t) => {
  const repository = await freshRepository();
  const { base, port } = await startServer(t, repository, { maxRecords: 100, maxLineBytes: 300 });
  const before = await readFile(repository.file, "utf8");
  // 10,000 lines against a budget of 100: the server answers 413 and closes before the body has arrived,
  // so a fetch would fail writing the rest (EPIPE); a raw socket still reads the answer.
  const tooMany = await rawImport(port, linesOf(synthetic(10_000, 7)));
  assert.match(tooMany, /^HTTP\/1\.1 413/);
  assert.match(tooMany, /"details":\{"maxRecords":100\}/);
  const longLine = await postImport(base, habitLine({ id: "h-901", name: "x".repeat(80), frequency: "daily", active: true, completions: [] }).replace('"x', `"${" ".repeat(400)}x`));
  assert.equal(longLine.status, 413);
  assert.equal(longLine.json.error.details.line, 1);
  assert.equal(await readFile(repository.file, "utf8"), before);
  assert.equal((await postImport(base, linesOf(synthetic(100, 7)))).status, 200);
});

// Sends a whole import body over a raw socket and returns everything the server answered before it closed.
function rawImport(port: number, body: string): Promise<string> {
  return new Promise((resolve) => {
    let text = "";
    const socket = net.connect(port, "127.0.0.1", () => {
      socket.write(`POST /v1/import HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/x-ndjson\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n`);
      socket.write(body);
    });
    socket.on("data", (chunk) => (text += chunk));
    socket.on("error", () => {});
    socket.on("close", () => resolve(text));
    setTimeout(() => socket.destroy(), 5000);
  });
}

// Sends the head and part of a chunked import body over a raw socket and keeps the connection open.
function startSlowImport(port: number, lines: string): Promise<net.Socket> {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1", () => {
      socket.write("POST /v1/import HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/x-ndjson\r\nTransfer-Encoding: chunked\r\n\r\n");
      socket.write(`${Buffer.byteLength(lines).toString(16)}\r\n${lines}\r\n`);
      resolve(socket);
    });
    socket.on("error", () => {});
  });
}

test("a client that goes away in the middle aborts the import: nothing is written, the next import runs", async (t) => {
  const repository = await freshRepository();
  const { base, port } = await startServer(t, repository);
  const before = await readFile(repository.file, "utf8");
  const socket = await startSlowImport(port, linesOf(synthetic(50)));
  await new Promise((resolve) => setTimeout(resolve, 100));
  socket.destroy();
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(await readFile(repository.file, "utf8"), before);
  const next = await postImport(base, linesOf(synthetic(3)));
  assert.equal(next.status, 200); // the slot of the aborted job is free again
  assert.equal((await repository.list()).length, 9);
});

test("while one import runs, a second one is refused at once with 503 and Retry-After", async (t) => {
  const repository = await freshRepository();
  const { base, port } = await startServer(t, repository);
  const socket = await startSlowImport(port, linesOf(synthetic(10)));
  t.after(() => socket.destroy());
  await new Promise((resolve) => setTimeout(resolve, 100));
  const second = await postImport(base, linesOf(synthetic(3)));
  assert.equal(second.status, 503);
  assert.equal(second.json.error.code, "IMPORT_BUSY");
  assert.equal(second.headers.get("retry-after"), "1");
  const answer = new Promise<string>((resolve) => {
    let text = "";
    socket.on("data", (chunk) => {
      text += chunk;
      if (/\r\n\r\n[\s\S]*\}/.test(text)) {
        resolve(text);
      }
    });
    socket.on("close", () => resolve(text));
  });
  socket.write("0\r\n\r\n"); // the last chunk: the body is complete
  assert.match(await answer, /^HTTP\/1\.1 200/);
  assert.equal((await repository.list()).length, 16);
});

test("a write that fails for a passing reason is retried, and the retry duplicates nothing", async (t) => {
  const repository = await freshRepository();
  let calls = 0;
  const flaky: HabitRepository = {
    ...repository,
    upsertMany: async (habits) => {
      calls += 1;
      if (calls === 1) {
        throw Object.assign(new Error("resource busy"), { code: "EBUSY" });
      }
      return repository.upsertMany(habits);
    },
  };
  const { base } = await startServer(t, flaky);
  const answer = await postImport(base, linesOf(synthetic(20)));
  assert.equal(answer.status, 200);
  assert.equal(calls, 2);
  assert.equal((await repository.list()).length, 26);
});
