// The CP-NO checks as one test file — `npm test` in server/: the six checks of the checkpoint through the code
// the browser runs (the web client's HTTP source, ../../data/httpApi.ts) against the REAL server process
// (src/server.ts started with node, stopped with SIGTERM and started again on the same data folder): create,
// update, restart, reload (a new client with nothing cached), invalid input (exactly 400, nothing stored) and a
// client without the server (it rejects as "no connection" and invents nothing). The count of pending tasks due
// by a day is computed for the FIXED day DAY with the web app's own countDueTasks — never the clock's today. What
// the page shows in a browser is the other half of the evidence (docs/CP-NO.md).
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { ApiError } from "../../data/apiError.ts";
import { createHttpApi } from "../../data/httpApi.ts";
import { countDueTasks } from "../../domain/tasks.ts";
import type { Task } from "../../domain/tasks.ts";
import type { TaskFields } from "../../ui/tasksReducer.ts";

const [major, minor] = process.versions.node.split(".").map(Number);
const TS = major > 22 || (major === 22 && minor >= 18) ? [] : ["--experimental-strip-types"];
const SERVER = path.join(import.meta.dirname, "..", "src", "server.ts");
// The fixed day of the check: the fixtures are dated around it, and a test that read the clock would give
// another count tomorrow.
const DAY = "2026-03-02";

async function freePort(): Promise<number> {
  const probe = http.createServer();
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const { port } = probe.address() as AddressInfo;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

// The real server; resolves when it listens. Its JSON log lines are kept for the checks.
async function start(t: TestContext, port: number, dataDir: string): Promise<{ child: ChildProcess; log: () => string }> {
  const child = spawn(process.execPath, [...TS, SERVER], { env: { ...process.env, PORT: String(port), DATA_DIR: dataDir }, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  child.stdout!.on("data", (chunk) => (log += chunk));
  child.stderr!.on("data", (chunk) => (log += chunk));
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
    }
  });
  const started = Date.now();
  while (!log.includes("listening")) {
    assert.ok(child.exitCode === null && Date.now() - started < 5000, `the server did not start: ${log}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return { child: child, log: () => log };
}

// The log arrives through a pipe: wait (at most 2 s) until a line matches.
async function logMatches(log: () => string, pattern: RegExp): Promise<boolean> {
  const started = Date.now();
  while (!pattern.test(log()) && Date.now() - started < 2000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return pattern.test(log());
}

async function stop(running: { child: ChildProcess }): Promise<number | null> {
  const exited = once(running.child, "exit");
  running.child.kill("SIGTERM");
  const [code] = await exited;
  return code as number | null;
}

const client = (port: number) => createHttpApi({ baseUrl: `http://127.0.0.1:${port}`, fetch: (url, init) => fetch(url, init), timeoutMs: 1000 });

test("CP-NO: a task created and another marked done from the client survive a restart, and the due count for the fixed day is the expected one", async (t) => {
  const port = await freePort();
  const dataDir = path.join(import.meta.dirname, "..", ".check", "checkpoint", randomUUID());
  const first = await start(t, port, dataDir);
  const before = (await client(port).listTasks("all")) as Task[];
  const t02 = before.find((task) => task.id === "t-02");
  assert.ok(t02 !== undefined && !t02.done, "t-02 starts pending");
  await client(port).createTask({ title: "Купити квитки CP", dueDate: DAY, done: false, priority: "high" });
  const created = ((await client(port).listTasks("all")) as Task[]).find((task) => task.title === "Купити квитки CP");
  assert.ok(created, "create: the new task is in the server's list");
  await client(port).setDone("t-02", true);
  assert.ok(await logMatches(first.log, /"method":"POST","route":"\/v1\/records","status":201/), "the create is in the server log");
  assert.ok(await logMatches(first.log, /"method":"PATCH","route":"\/v1\/records\/t-02","status":200/), "the mark is in the server log");
  assert.equal(await stop(first), 0, "restart: the server stops cleanly");

  const second = await start(t, port, dataDir);
  // A reload: a new client with nothing cached asks the restarted server.
  const after = (await client(port).listTasks("all")) as Task[];
  assert.equal(after.length, before.length + 1);
  assert.deepEqual(after.find((task) => task.id === created.id), { id: created.id, title: "Купити квитки CP", dueDate: DAY, done: false, priority: "high" }, "the created task survived the restart");
  assert.equal(after.find((task) => task.id === "t-02")?.done, true, "the mark survived the restart");
  // Expected: the count before, +1 for the new pending task due on DAY, −1 for t-02 when it was pending and due by DAY.
  const t02Counted = t02.dueDate !== null && t02.dueDate <= DAY ? 1 : 0;
  assert.equal(countDueTasks(after, DAY), countDueTasks(before, DAY) + 1 - t02Counted, "the due count for the fixed day");
  assert.ok(await logMatches(second.log, /"method":"GET","route":"\/v1\/records","status":200/), "the reload's GET is in the restarted server's log");
});

test("CP-NO: invalid input is exactly 400 and stores nothing; without the server the client says so and invents nothing", async (t) => {
  const port = await freePort();
  const dataDir = path.join(import.meta.dirname, "..", ".check", "checkpoint", randomUUID());
  const running = await start(t, port, dataDir);
  const before = (await client(port).listTasks("all")) as Task[];
  await assert.rejects(client(port).createTask({ title: "", dueDate: "2026-02-31", done: false, priority: "high" }), (error: unknown) => error instanceof ApiError && error.status === 400);
  await assert.rejects(client(port).saveTask("t-01", { title: "%%fixture1Name%%", dueDate: DAY, done: false, priority: "urgent" } as unknown as TaskFields), (error: unknown) => error instanceof ApiError && error.status === 400);
  assert.deepEqual(await client(port).listTasks("all"), before, "nothing stored after the refusals");
  assert.ok(await logMatches(running.log, /"method":"POST","route":"\/v1\/records","status":400/), "the create's refusal is in the log as 400");
  assert.ok(await logMatches(running.log, /"method":"PUT","route":"\/v1\/records\/t-01","status":400/), "the change's refusal is in the log as 400");
  assert.doesNotMatch(running.log(), /"status":5\d\d/, "a refusal is never a 5xx");
  assert.equal(await stop(running), 0);
  await assert.rejects(client(port).listTasks("all"), TypeError, "no server: fetch rejects, the client has nothing to show");
  await assert.rejects(client(port).setDone("t-01", true), TypeError, "no server: the change is not saved, and the client says so");
});
