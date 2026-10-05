// The CP-NO checks as one test file — `npm test` in server/: the six checks of the checkpoint through the code
// the browser runs (the web client's HTTP source, ../../data/httpApi.ts) against the REAL server process
// (src/server.ts started with node, stopped with SIGTERM and started again on the same data folder): create,
// update, restart, reload (a new client with nothing cached), invalid input (exactly 400, nothing stored) and a
// client without the server (it rejects as "no connection" and invents nothing). The totals are whole kopiykas
// (amountMinor) and are compared exactly, with no rounding. What the page shows in a browser is the other half of
// the evidence (docs/CP-NO.md).
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
import { summarizeExpenses } from "../../domain/expenses.ts";
import type { Expense } from "../../domain/expenses.ts";

const [major, minor] = process.versions.node.split(".").map(Number);
const TS = major > 22 || (major === 22 && minor >= 18) ? [] : ["--experimental-strip-types"];
const SERVER = path.join(import.meta.dirname, "..", "src", "server.ts");

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

test("CP-NO: an expense added from the client survives a restart, and the totals in amountMinor are exact", async (t) => {
  const port = await freePort();
  const dataDir = path.join(import.meta.dirname, "..", ".check", "checkpoint", randomUUID());
  const first = await start(t, port, dataDir);
  const before = (await client(port).listExpenses("all")) as Expense[];
  const totalsBefore = summarizeExpenses(before);
  await client(port).createExpense({ label: "Настолка CP", amountMinor: 15000, date: "2026-03-02", category: "fun" });
  const created = ((await client(port).listExpenses("all")) as Expense[]).find((expense) => expense.label === "Настолка CP");
  assert.ok(created, "create: the new expense is in the server's list");
  // An update that keeps the amount and the category: only the label changes, so no total may move.
  const e03 = before.find((expense) => expense.id === "e-03");
  assert.ok(e03, "the fixtures have e-03");
  await client(port).saveExpense("e-03", { label: "%%fixture3Name%% CP", amountMinor: e03.amountMinor, date: e03.date, category: e03.category });
  assert.ok(await logMatches(first.log, /"method":"POST","route":"\/v1\/records","status":201/), "the create is in the server log");
  assert.ok(await logMatches(first.log, /"method":"PUT","route":"\/v1\/records\/e-03","status":200/), "the update is in the server log");
  assert.equal(await stop(first), 0, "restart: the server stops cleanly");

  const second = await start(t, port, dataDir);
  // A reload: a new client with nothing cached asks the restarted server.
  const after = (await client(port).listExpenses("all")) as Expense[];
  assert.equal(after.length, before.length + 1);
  assert.deepEqual(after.find((expense) => expense.id === created.id), { id: created.id, label: "Настолка CP", amountMinor: 15000, date: "2026-03-02", category: "fun" }, "the new expense survived the restart, its amount an integer");
  assert.equal(after.find((expense) => expense.id === "e-03")?.label, "%%fixture3Name%% CP", "the update survived the restart");
  // Expected = before + 15000 in fun, nothing else changes; integers compared exactly.
  const expected = { total: totalsBefore.total + 15000, byCategory: { ...totalsBefore.byCategory, fun: totalsBefore.byCategory.fun + 15000 } };
  assert.deepEqual(summarizeExpenses(after), expected);
  assert.ok(after.every((expense) => Number.isInteger(expense.amountMinor)), "every amount from the server is a whole number of kopiykas");
  assert.ok(await logMatches(second.log, /"method":"GET","route":"\/v1\/records","status":200/), "the reload's GET is in the restarted server's log");
});

test("CP-NO: invalid input is exactly 400 and stores nothing; without the server the client says so and invents nothing", async (t) => {
  const port = await freePort();
  const dataDir = path.join(import.meta.dirname, "..", ".check", "checkpoint", randomUUID());
  const running = await start(t, port, dataDir);
  const before = (await client(port).listExpenses("all")) as Expense[];
  // A fraction of a kopiyka and an unknown category: refused, never rounded or guessed.
  await assert.rejects(client(port).createExpense({ label: "Настолка", amountMinor: 150.5, date: "2026-03-02", category: "fun" }), (error: unknown) => error instanceof ApiError && error.status === 400);
  await assert.rejects(client(port).saveExpense("e-03", { label: "%%fixture3Name%%", amountMinor: 18000, date: "2026-02-28", category: "gifts" as "fun" }), (error: unknown) => error instanceof ApiError && error.status === 400);
  assert.deepEqual(await client(port).listExpenses("all"), before, "nothing stored after the refusals");
  assert.ok(await logMatches(running.log, /"method":"POST","route":"\/v1\/records","status":400/), "the refused create is in the log as 400");
  assert.ok(await logMatches(running.log, /"method":"PUT","route":"\/v1\/records\/e-03","status":400/), "the refused update is in the log as 400");
  assert.doesNotMatch(running.log(), /"status":5\d\d/, "a refusal is never a 5xx");
  assert.equal(await stop(running), 0);
  await assert.rejects(client(port).listExpenses("all"), TypeError, "no server: fetch rejects, the client has nothing to show");
  await assert.rejects(client(port).saveExpense("e-03", { label: "%%fixture3Name%%", amountMinor: 18000, date: "2026-02-28", category: "fun" }), TypeError, "no server: the change is not saved, and the client says so");
});
