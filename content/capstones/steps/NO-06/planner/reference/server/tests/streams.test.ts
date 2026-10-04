// Tests of the streamed export and import over real HTTP and on real files: JSON lines out, backpressure,
// a temp file that never survives an abort, an import of 10,000 synthetic tasks that a retry never
// duplicates, a done task that an import never reopens, every line checked with its number (a due date
// that names no day too), the job's budget, a client that goes away, a busy import queue and a retried write.
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { Writable } from "node:stream";
import { makeSyntheticTasks } from "../../data/synthetic.js";
import type { Task } from "../../domain/tasks.ts";
import { createFileRepository } from "../src/fileRepository.ts";
import type { TaskRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import type { ImportLimits } from "../src/importer.ts";
import { exportToFile, taskLine, writeJsonLines } from "../src/jsonl.ts";
import { createRecordsServer } from "../src/server.ts";

const synthetic = (count: number): Task[] => (makeSyntheticTasks(count) as Task[]).map((task, index) => ({ ...task, id: `t-${101 + index}` }));
const linesOf = (tasks: Task[]) => tasks.map(taskLine).join("");

async function freshRepository(): Promise<TaskRepository> {
  const repository = createFileRepository(path.join(import.meta.dirname, "..", ".check", "streams", randomUUID()));
  await repository.seed(await loadFixtures());
  return repository;
}

async function startServer(t: TestContext, repository: TaskRepository, importLimits: Partial<ImportLimits> = {}): Promise<{ base: string; port: number }> {
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

test("GET /v1/export streams every task as one JSON line, fields in a fixed order", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const response = await fetch(`${base}/v1/export`, { signal: AbortSignal.timeout(2000) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^application\/x-ndjson/);
  const text = await response.text();
  assert.equal(text, linesOf(await repository.list()));
  assert.deepEqual(Object.keys(JSON.parse(text.split("\n")[0])), ["id", "title", "dueDate", "done", "priority"]);
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
  const lines = synthetic(300).map(taskLine);
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

test("a retried import of the same file duplicates nothing: 10,000 synthetic tasks, imported twice", async (t) => {
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
  assert.equal(new Set(stored.map((task) => task.id)).size, 10_006);
  const exported = await (await fetch(`${base}/v1/export`, { signal: AbortSignal.timeout(5000) })).text();
  assert.equal(exported.split("\n").filter((line) => line !== "").length, 10_006);
});

test("an import is an upsert by id: a known id takes the line's fields in its place, and a done task stays done", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const finished: Task = { id: "t-02", title: "%%fixture2Name%% (new)", dueDate: "2026-03-03", done: true, priority: "low" };
  const reopened: Task = { id: "t-04", title: "%%fixture4Name%% (new)", dueDate: null, done: false, priority: "normal" };
  const added: Task = { id: "t-07", title: "%%fixture1Name%% 2", dueDate: "2026-03-04", done: false, priority: "high" };
  const answer = await postImport(base, taskLine(finished) + taskLine(reopened) + taskLine(added));
  assert.deepEqual(answer.json, { lines: 3, created: 1, updated: 2 });
  const stored = await repository.list();
  assert.deepEqual(stored.map((task) => task.id), ["t-01", "t-02", "t-03", "t-04", "t-05", "t-06", "t-07"]);
  assert.deepEqual(stored[1], finished); // a line that says done completes a pending task
  assert.deepEqual(stored[3], { ...reopened, done: true }); // t-04 was done: the import never reopens it
  assert.deepEqual(stored[6], added);
});

test("a task completed between two imports of the same file stays done", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const tasks = synthetic(50);
  const body = linesOf(tasks);
  assert.equal(tasks[1].done, false); // t-102 is pending in the file
  assert.deepEqual((await postImport(base, body)).json, { lines: 50, created: 50, updated: 0 });
  const patched = await fetch(`${base}/v1/records/t-102`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ done: true }), signal: AbortSignal.timeout(2000) });
  assert.equal(patched.status, 200);
  assert.deepEqual((await postImport(base, body)).json, { lines: 50, created: 0, updated: 50 });
  assert.deepEqual(await repository.get("t-102"), { ...tasks[1], done: true });
  assert.deepEqual(await repository.get("t-103"), tasks[2]); // the other tasks are exactly their lines
  assert.equal((await repository.list()).filter((task) => task.done).length, 2 + 13 + 1); // fixtures, done lines, t-102
});

test("every line is checked and named by its number; one bad line and nothing is written", async (t) => {
  const repository = await freshRepository();
  const { base } = await startServer(t, repository);
  const before = await readFile(repository.file, "utf8");
  const good = synthetic(5).map(taskLine);
  const body = [good[0], "\n", '{"id":"t-901","title":"x","dueDate":"2026-02-31","done":false,"priority":"normal"}\n', good[1], "{not json\n", good[2], '{"id":"../t-01","title":"x","dueDate":null,"done":false,"priority":"normal"}\n', good[3], '{"id":"t-902","title":"x","dueDate":null,"done":false,"priority":"normal","isAdmin":true}\n', good[0], '{"id":"t-903","title":"x","dueDate":"2026-13","done":"yes","priority":"urgent"}\n'].join("");
  const answer = await postImport(base, body);
  assert.equal(answer.status, 400);
  assert.equal(answer.json.error.code, "VALIDATION_FAILED");
  assert.deepEqual(answer.json.error.details, { "line 3": "dueDate: notRealDate", "line 5": "not-json", "line 7": "id: malformed", "line 9": "isAdmin: unknown", "line 10": "id: duplicate", "line 11": "dueDate: notCalendarDate, done: notBoolean, priority: unknown" });
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
  const longLine = await postImport(base, taskLine({ id: "t-901", title: "x".repeat(80), dueDate: null, done: false, priority: "normal" }).replace('"x', `"${" ".repeat(400)}x`));
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
  const flaky: TaskRepository = {
    ...repository,
    upsertMany: async (tasks) => {
      calls += 1;
      if (calls === 1) {
        throw Object.assign(new Error("resource busy"), { code: "EBUSY" });
      }
      return repository.upsertMany(tasks);
    },
  };
  const { base } = await startServer(t, flaky);
  const answer = await postImport(base, linesOf(synthetic(20)));
  assert.equal(answer.status, 200);
  assert.equal(calls, 2);
  assert.equal((await repository.list()).length, 26);
});
