// The CP-NO checks as one test file — `npm test` in server/: the six checks of the checkpoint through the code
// the browser runs (the web client's HTTP source, ../../data/httpApi.ts) against the REAL server process
// (src/server.ts started with node, stopped with SIGTERM and started again on the same data folder): a day
// marked done, a habit paused, restart, reload (a new client with nothing cached), invalid input (exactly 400,
// nothing stored) and a client without the server (it rejects as "no connection" and invents nothing). The
// streak is computed for a FIXED day, DAY below, with the web app's own streakOf — never for the clock's
// today, so the test means the same thing on any day it runs. What the page shows in a browser is the other
// half of the evidence (docs/CP-NO.md).
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
import type { Habit } from "../../domain/habits.ts";
import { streakOf } from "../../ui/streak.ts";

const [major, minor] = process.versions.node.split(".").map(Number);
const TS = major > 22 || (major === 22 && minor >= 18) ? [] : ["--experimental-strip-types"];
const SERVER = path.join(import.meta.dirname, "..", "src", "server.ts");
// "Today" for the checkpoint: the day the page would pass in, fixed so the streak does not depend on the clock.
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

const find = (habits: Habit[], id: string): Habit => {
  const habit = habits.find((one) => one.id === id);
  assert.ok(habit, `${id} is in the server's list`);
  return habit;
};

test("CP-NO: a day marked done and a paused habit survive a restart, and the streak for the fixed day comes from the server's days", async (t) => {
  const port = await freePort();
  const dataDir = path.join(import.meta.dirname, "..", ".check", "checkpoint", randomUUID());
  const first = await start(t, port, dataDir);
  const before = (await client(port).listHabits("all")) as Habit[];
  const h01Before = find(before, "h-01");
  const h02Before = find(before, "h-02");
  assert.equal(h01Before.frequency, "daily");
  assert.equal(h01Before.completions.includes(DAY), false, "the fixed day is not done yet");
  // Not done today yet: the streak counts up to yesterday (2026-02-27, 02-28, 03-01 → 3).
  assert.equal(streakOf(h01Before.completions, DAY), 3);
  await client(port).addCompletion("h-01", DAY);
  // The same day again (a second press, a retried request): the server keeps it once.
  await client(port).addCompletion("h-01", DAY);
  await client(port).saveHabit("h-02", { name: h02Before.name, frequency: h02Before.frequency, active: false });
  assert.ok(await logMatches(first.log, /"method":"POST","route":"\/v1\/records\/h-01\/completions","status":200/), "the marked day is in the server log");
  assert.ok(await logMatches(first.log, /"method":"PATCH","route":"\/v1\/records\/h-02","status":200/), "the pause is in the server log");
  assert.equal(await stop(first), 0, "restart: the server stops cleanly");

  const second = await start(t, port, dataDir);
  // A reload: a new client with nothing cached asks the restarted server.
  const after = (await client(port).listHabits("all")) as Habit[];
  assert.equal(after.length, before.length, "no habit added or lost");
  const h01 = find(after, "h-01");
  assert.deepEqual(h01.completions, [...h01Before.completions, DAY], "the marked day survived the restart, once");
  assert.equal(streakOf(h01.completions, DAY), streakOf(h01Before.completions, DAY) + 1);
  assert.equal(streakOf(h01.completions, DAY), 4, "2026-02-27 … 2026-03-02");
  const h02 = find(after, "h-02");
  assert.equal(h02.active, false, "the pause survived the restart");
  assert.deepEqual(h02.completions, h02Before.completions, "pausing kept every marked day (PATCH merges, it does not replace)");
  assert.equal(streakOf(h02.completions, DAY), 2, "2026-02-28, 2026-03-01: a pause does not change the streak");
  for (const id of ["h-03", "h-04", "h-05", "h-06"]) {
    assert.deepEqual(find(after, id), find(before, id), `${id} is unchanged`);
  }
  assert.deepEqual(((await client(port).listHabits("paused")) as Habit[]).map((habit) => habit.id).sort(), ["h-02", "h-05"], "the server's own filter sees the pause");
  assert.ok(await logMatches(second.log, /"method":"GET","route":"\/v1\/records","status":200/), "the reload's GET is in the restarted server's log");
});

test("CP-NO: invalid input is exactly 400 and stores nothing; without the server the client says so and invents nothing", async (t) => {
  const port = await freePort();
  const dataDir = path.join(import.meta.dirname, "..", ".check", "checkpoint", randomUUID());
  const running = await start(t, port, dataDir);
  const before = (await client(port).listHabits("all")) as Habit[];
  const isBadRequest = (error: unknown) => error instanceof ApiError && error.status === 400;
  await assert.rejects(client(port).createHabit({ name: "", frequency: "daily", active: true }), isBadRequest);
  await assert.rejects(client(port).saveHabit("h-01", { name: "%%fixture1Name%%", frequency: "monthly" as Habit["frequency"], active: true }), isBadRequest);
  await assert.rejects(client(port).addCompletion("h-01", "2026-02-30"), isBadRequest, "a day that is not in the calendar");
  await assert.rejects(client(port).addCompletion("h-01", "2.03.2026"), isBadRequest, "a day not written YYYY-MM-DD");
  assert.deepEqual(await client(port).listHabits("all"), before, "nothing stored after the refusals");
  assert.ok(await logMatches(running.log, /"method":"POST","route":"\/v1\/records","status":400/), "the refused create is in the log as 400");
  assert.ok(await logMatches(running.log, /"method":"PATCH","route":"\/v1\/records\/h-01","status":400/), "the refused change is in the log as 400");
  assert.ok(await logMatches(running.log, /"method":"POST","route":"\/v1\/records\/h-01\/completions","status":400/), "the refused day is in the log as 400");
  assert.doesNotMatch(running.log(), /"status":5\d\d/, "a refusal is never a 5xx");
  assert.equal(await stop(running), 0);
  await assert.rejects(client(port).listHabits("all"), TypeError, "no server: fetch rejects, the client has nothing to show");
  await assert.rejects(client(port).addCompletion("h-01", DAY), TypeError, "no server: the day is not saved, and the client says so");
});
