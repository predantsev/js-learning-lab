// Tests of the streamed export and import over real HTTP and on real files: JSON lines out, backpressure,
// a temp file that never survives an abort, an import of 10,000 synthetic expenses that a retry never
// duplicates, category totals that a retried import never doubles, every line checked with its number,
// the job's budget, a client that goes away, a busy import queue and a retried write.
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { Writable } from "node:stream";
import { makeSyntheticExpenses } from "../../data/synthetic.js";
import { summarizeExpenses } from "../../domain/expenses.ts";
import type { CategoryId, Expense } from "../../domain/expenses.ts";
import { createFileRepository } from "../src/fileRepository.ts";
import type { ExpenseRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import type { ImportLimits } from "../src/importer.ts";
import { exportToFile, expenseLine, writeJsonLines } from "../src/jsonl.ts";
import { createRecordsServer } from "../src/server.ts";

const synthetic = (count: number): Expense[] => makeSyntheticExpenses(count).map((expense, index) => ({ ...expense, id: `e-${101 + index}`, category: expense.category as CategoryId }));
const linesOf = (expenses: Expense[]) => expenses.map(expenseLine).join("");

async function freshRepository(): Promise<ExpenseRepository> {
  const repository = createFileRepository(path.join(import.meta.dirname, "..", ".check", "streams", randomUUID()));
  await repository.seed(await loadFixtures());
  return repository;
}

async function startServer(t: TestContext, repository: ExpenseRepository, importLimits: Partial<ImportLimits> = {}): Promise<{ base: string; port: number }> {
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

test("GET /v1/export streams every expense as one JSON line, fields in a fixed order", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const response = await fetch(`${base}/v1/export`, { signal: AbortSignal.timeout(2000) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^application\/x-ndjson/);
  const text = await response.text();
  assert.equal(text, linesOf(await repository.list()));
  assert.deepEqual(Object.keys(JSON.parse(text.split("\n")[0])), ["id", "label", "amountMinor", "date", "category"]);
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
  const lines = synthetic(300).map(expenseLine);
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

test("10,000 synthetic expenses import once; the same file imported again duplicates nothing", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const body = linesOf(synthetic(10_000));
  const first = await postImport(base, body);
  assert.equal(first.status, 200);
  assert.deepEqual(first.json, { lines: 10_000, created: 10_000, updated: 0 });
  const again = await postImport(base, body);
  assert.deepEqual(again.json, { lines: 10_000, created: 0, updated: 10_000 });
  const stored = await repository.list();
  assert.equal(stored.length, 10_006);
  assert.equal(new Set(stored.map((expense) => expense.id)).size, 10_006);
  const exported = await (await fetch(`${base}/v1/export`, { signal: AbortSignal.timeout(5000) })).text();
  assert.equal(exported.split("\n").filter((line) => line !== "").length, 10_006);
});

test("an import is an upsert by id: a known id replaces the stored expense in its place", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const changed: Expense = { id: "e-02", label: "%%fixture2Name%% (new)", amountMinor: 60000, date: "2026-04-01", category: "transport" };
  const answer = await postImport(base, expenseLine(changed) + expenseLine({ id: "e-07", label: "%%fixture6Name%% 2", amountMinor: 15000, date: "2026-03-03", category: "food" }));
  assert.deepEqual(answer.json, { lines: 2, created: 1, updated: 1 });
  const stored = await repository.list();
  assert.deepEqual(stored.map((expense) => expense.id), ["e-01", "e-02", "e-03", "e-04", "e-05", "e-06", "e-07"]);
  assert.deepEqual(stored[1], changed);
});

test("a retried import never doubles a category total: the totals after the same file twice equal those after once", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const fixtures = await loadFixtures();
  const changed: Expense = { ...fixtures[0], amountMinor: fixtures[0].amountMinor + 1000 };
  const imported = [changed, ...synthetic(1000)];
  const body = linesOf(imported);
  // The totals the store must hold: the starting expenses with e-01 replaced, plus the new ones — counted once.
  const expected = summarizeExpenses([changed, ...fixtures.slice(1), ...imported.slice(1)]).byCategory;
  assert.deepEqual((await postImport(base, body)).json, { lines: 1001, created: 1000, updated: 1 });
  const once = summarizeExpenses(await repository.list()).byCategory;
  assert.deepEqual(once, expected);
  assert.deepEqual((await postImport(base, body)).json, { lines: 1001, created: 0, updated: 1001 });
  const twice = summarizeExpenses(await repository.list()).byCategory;
  assert.deepEqual(twice, once);
});

test("every line is checked and named by its number; one bad line and nothing is written", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const before = await readFile(repository.file, "utf8");
  const good = synthetic(5).map(expenseLine);
  const line = (fields: Record<string, unknown>) => JSON.stringify({ id: "e-901", label: "x", amountMinor: 100, date: "2025-01-01", category: "food", ...fields }) + "\n";
  const body = [good[0], "\n", line({ amountMinor: 1.5 }), good[1], "{not json\n", good[2], line({ id: "../e-01" }), good[3], line({ id: "e-902", isAdmin: true }), good[0], line({ id: "e-903", amountMinor: 0 }), line({ id: "e-904", category: "travel" }), line({ id: "e-905", label: "x".repeat(81) }), line({ id: "e-906", date: "01.01.2025" })].join("");
  const answer = await postImport(base, body);
  assert.equal(answer.status, 400);
  assert.equal(answer.json.error.code, "VALIDATION_FAILED");
  assert.deepEqual(answer.json.error.details, { "line 3": "amountMinor: notPositiveWhole", "line 5": "not-json", "line 7": "id: malformed", "line 9": "isAdmin: unknown", "line 10": "id: duplicate", "line 11": "amountMinor: notPositiveWhole", "line 12": "category: unknown", "line 13": "label: length1to80", "line 14": "date: notCalendarDate" });
  assert.equal(await readFile(repository.file, "utf8"), before);
});

test("the job's budget: more lines than maxRecords, or one line over maxLineBytes, is 413 and nothing is written", async (t) => {
  const repository = await freshRepository();
  const { base, port } = await startServer(t, repository, { maxRecords: 100, maxLineBytes: 300 });
  const before = await readFile(repository.file, "utf8");
  // 10,000 lines against a budget of 100: the server answers 413 and closes before the body has arrived,
  // so a fetch would fail writing the rest (EPIPE); a raw socket still reads the answer.
  const tooMany = await rawImport(port, linesOf(synthetic(10_000)));
  assert.match(tooMany, /^HTTP\/1\.1 413/);
  assert.match(tooMany, /"details":\{"maxRecords":100\}/);
  const longLine = await postImport(base, expenseLine({ id: "e-901", label: "x".repeat(80), amountMinor: 1, date: "2025-01-01", category: "food" }).replace('"x', `"${" ".repeat(400)}x`));
  assert.equal(longLine.status, 413);
  assert.equal(longLine.json.error.details.line, 1);
  assert.equal(await readFile(repository.file, "utf8"), before);
  assert.equal((await postImport(base, linesOf(synthetic(100)))).status, 200);
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
  const flaky: ExpenseRepository = {
    ...repository,
    upsertMany: async (expenses) => {
      calls += 1;
      if (calls === 1) {
        throw Object.assign(new Error("resource busy"), { code: "EBUSY" });
      }
      return repository.upsertMany(expenses);
    },
  };
  const { base } = await startServer(t, flaky);
  const answer = await postImport(base, linesOf(synthetic(20)));
  assert.equal(answer.status, 200);
  assert.equal(calls, 2);
  assert.equal((await repository.list()).length, 26);
});
