// Tests of the server as a service — `npm test` in server/: /livez, /readyz and /metrics over real HTTP; a
// graceful shutdown of the real process (a child started with node, a SIGTERM while a request is still
// sending its body); the production build; the restore drill on a fixed day; the metric of recorded
// completions; and a latency budget on 20,000 synthetic habits, because six starting habits never show work
// that grows with the size of the data.
import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { createFileRepository, DATA_FILE_NAME } from "../src/fileRepository.ts";
import type { HabitRepository } from "../src/fileRepository.ts";
import { loadFixtures } from "../src/fixtures.ts";
import { createMetrics } from "../src/metrics.ts";
import { createRecordsServer } from "../src/server.ts";
import type { Ops } from "../src/server.ts";
import { makeSyntheticHabits } from "../../data/synthetic.js";
import type { Habit } from "../../domain/habits.ts";

const SRC = path.join(import.meta.dirname, "..", "src");
// Node 22.13–22.17 runs a .ts file only with this flag; 22.18 and newer need none.
const [major, minor] = process.versions.node.split(".").map(Number);
const TS = major > 22 || (major === 22 && minor >= 18) ? [] : ["--experimental-strip-types"];

const freshFolder = () => path.join(import.meta.dirname, "..", ".check", "ops", randomUUID());

async function seeded(folder: string): Promise<HabitRepository> {
  const repository = createFileRepository(folder);
  await repository.seed(await loadFixtures());
  return repository;
}

async function startServer(t: TestContext, repository: HabitRepository, ops: Partial<Ops> = {}): Promise<string> {
  const server = createRecordsServer(repository, () => {}, {}, {}, undefined, ops);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

async function freePort(): Promise<number> {
  const probe = http.createServer();
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const { port } = probe.address() as AddressInfo;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

// The real server as a child process; resolves when it prints its "listening" line.
async function startProcess(t: TestContext, script: string, env: Record<string, string>): Promise<{ child: ChildProcess; output: () => string }> {
  const child = spawn(process.execPath, [...TS, script], { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  child.stdout!.on("data", (chunk) => (output += chunk));
  child.stderr!.on("data", (chunk) => (output += chunk));
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
    }
  });
  const started = Date.now();
  while (!output.includes("listening")) {
    assert.ok(child.exitCode === null && Date.now() - started < 5000, `the server did not start: ${output}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return { child: child, output: () => output };
}

// A POST whose body is still on its way: the headers and half of the body now, the rest by finish().
function slowCreate(port: number, habit: object) {
  const body = JSON.stringify(habit);
  const socket = net.connect(port, "127.0.0.1");
  let answer = "";
  socket.setEncoding("utf8").on("data", (chunk) => (answer += chunk));
  const ended = once(socket, "close");
  socket.write(`POST /v1/records HTTP/1.1\r\nhost: 127.0.0.1\r\ncontent-type: application/json\r\ncontent-length: ${Buffer.byteLength(body)}\r\n\r\n${body.slice(0, 10)}`);
  return {
    finish: async () => {
      socket.write(body.slice(10));
      await ended;
      return answer;
    },
    socket: socket,
  };
}

test("/livez answers 200, /readyz 200 while the store reads and 503 when it cannot", async (t) => {
  const folder = freshFolder();
  const base = await startServer(t, await seeded(folder));
  const live = await fetch(`${base}/livez`);
  assert.equal(live.status, 200);
  assert.deepEqual(await live.json(), { status: "alive" });
  const ready = await fetch(`${base}/readyz`);
  assert.equal(ready.status, 200);
  assert.deepEqual(await ready.json(), { status: "ready" });
  await writeFile(path.join(folder, DATA_FILE_NAME), "{ damaged");
  const broken = await fetch(`${base}/readyz`);
  assert.equal(broken.status, 503);
  assert.deepEqual(await broken.json(), { status: "not ready" });
  assert.equal((await fetch(`${base}/livez`)).status, 200);
});

test("once a shutdown has begun /readyz is 503 and every answer closes its connection", async (t) => {
  const health = { shuttingDown: false };
  const base = await startServer(t, await seeded(freshFolder()), { health: health });
  health.shuttingDown = true;
  const ready = await fetch(`${base}/readyz`);
  assert.equal(ready.status, 503);
  assert.deepEqual(await ready.json(), { status: "shutting down" });
  const list = await fetch(`${base}/v1/records`);
  assert.equal(list.status, 200);
  assert.equal(list.headers.get("connection"), "close");
});

test("/metrics counts requests per route pattern and status, 5xx as errors, with p50 and p95 of each route", async (t) => {
  const metrics = createMetrics();
  const base = await startServer(t, await seeded(freshFolder()), { metrics: metrics });
  for (const address of ["/v1/records/h-01", "/v1/records/h-02", "/v1/records/h-99", "/no/such/path-1", "/no/such/path-2", "/v1/records"]) {
    await (await fetch(base + address)).text();
  }
  const response = await fetch(`${base}/metrics`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/plain/);
  const text = await response.text();
  assert.match(text, /^http_requests_total\{route="\/v1\/records\/:id",status="200"\} 2$/m);
  assert.match(text, /^http_requests_total\{route="\/v1\/records\/:id",status="404"\} 1$/m);
  assert.match(text, /^http_requests_total\{route="\(other\)",status="404"\} 2$/m);
  assert.match(text, /^http_errors_total\{route="\/v1\/records"\} 0$/m);
  assert.match(text, /^http_request_duration_ms\{route="\/v1\/records\/:id",quantile="0\.95"\} \d+\.\d$/m);
  assert.match(text, /^http_request_duration_ms_count\{route="\/v1\/records\/:id"\} 3$/m);
  assert.doesNotMatch(text, /h-01|path-1/);
  metrics.record("/v1/records", 500, 3);
  assert.match(metrics.render(), /^http_errors_total\{route="\/v1\/records"\} 1$/m);
});

test("habit_completions_recorded_total counts only the days that \"done\" really added", async (t) => {
  const metrics = createMetrics();
  const base = await startServer(t, await seeded(freshFolder()), { metrics: metrics });
  const done = async (id: string, day: string) => {
    const response = await fetch(`${base}/v1/records/${id}/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ day: day }) });
    await response.text();
    return response.status;
  };
  assert.match(metrics.render(), /^habit_completions_recorded_total 0$/m);
  assert.equal(await done("h-01", "2026-03-02"), 200); // a new day
  assert.equal(await done("h-01", "2026-03-02"), 200); // the same day again: answered, nothing added
  assert.equal(await done("h-02", "2026-03-01"), 200); // a day the starting habit has already
  assert.equal(await done("h-99", "2026-03-02"), 404);
  assert.equal(await done("h-03", "2026-02-30"), 400);
  const text = await (await fetch(`${base}/metrics`)).text();
  assert.match(text, /^habit_completions_recorded_total 1$/m);
  assert.match(text, /^http_requests_total\{route="\/v1\/records\/:id\/completions",status="200"\} 3$/m);
  assert.doesNotMatch(text, /h-01|h-99/);
});

test("SIGTERM with a request in flight: it is answered and saved, new connections are refused, exit code 0", async (t) => {
  const folder = freshFolder();
  await seeded(folder);
  const port = await freePort();
  const server = await startProcess(t, path.join(SRC, "server.ts"), { PORT: String(port), DATA_DIR: folder });
  const slow = slowCreate(port, { name: "Медитація 2", frequency: "daily", active: true });
  await new Promise((resolve) => setTimeout(resolve, 200));
  const exited = once(server.child, "exit");
  server.child.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 300));
  await assert.rejects(fetch(`http://127.0.0.1:${port}/livez`), (error: Error) => (error.cause as { code?: string })?.code === "ECONNREFUSED");
  // finish() resolves only when the socket closes: the server answers, then closes the connection itself.
  const answer = await slow.finish();
  assert.match(answer, /^HTTP\/1\.1 201 /);
  const [code] = await exited;
  assert.equal(code, 0, server.output());
  assert.match(server.output(), /SIGTERM received/);
  assert.ok((await createFileRepository(folder).list()).some((habit) => habit.name === "Медитація 2"));
});

test("a request still in flight at the deadline is cut, and the exit code is 1", async (t) => {
  const folder = freshFolder();
  await seeded(folder);
  const port = await freePort();
  const server = await startProcess(t, path.join(SRC, "server.ts"), { PORT: String(port), DATA_DIR: folder, SHUTDOWN_DEADLINE_MS: "300" });
  const slow = slowCreate(port, { name: "Медитація 3", frequency: "daily", active: true });
  await new Promise((resolve) => setTimeout(resolve, 200));
  const started = Date.now();
  server.child.kill("SIGTERM");
  const [code] = await once(server.child, "exit");
  assert.equal(code, 1);
  assert.ok(Date.now() - started < 3000);
  assert.match(server.output(), /deadline of 300 ms passed/);
  slow.socket.destroy();
  assert.ok(!(await createFileRepository(folder).list()).some((habit) => habit.name === "Медитація 3"));
});

test("an invalid configuration stops the start with every problem and exit code 1", () => {
  const result = spawnSync(process.execPath, [...TS, path.join(SRC, "server.ts")], { env: { ...process.env, PORT: "99999", SHUTDOWN_DEADLINE_MS: "5", ALLOWED_ORIGINS: "*" }, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /PORT must be/);
  assert.match(result.stderr, /SHUTDOWN_DEADLINE_MS must be/);
  assert.match(result.stderr, /ALLOWED_ORIGINS must be/);
});

test("the build is plain JavaScript that starts with node and answers /readyz", async (t) => {
  const out = freshFolder();
  const built = spawnSync(process.execPath, [path.join(import.meta.dirname, "..", "scripts", "build.mjs"), out], { encoding: "utf8" });
  assert.equal(built.status, 0, built.stderr);
  const server = await readFile(path.join(out, "server", "src", "server.js"), "utf8");
  assert.doesNotMatch(server, /\.ts"/);
  assert.doesNotMatch(server, /: http\.Server/);
  const pkg = JSON.parse(await readFile(path.join(out, "server", "package.json"), "utf8"));
  const port = await freePort();
  const data = freshFolder();
  const running = await startProcess(t, path.join(out, "server", "src", "server.js"), { PORT: String(port), DATA_DIR: data });
  assert.match(running.output(), new RegExp(`${pkg.name} ${pkg.version.replaceAll(".", "\\.")} \\(pid \\d+, NODE_ENV=`));
  assert.equal((await fetch(`http://127.0.0.1:${port}/readyz`)).status, 200);
  assert.equal(((await (await fetch(`http://127.0.0.1:${port}/v1/records`)).json()) as { items: Habit[] }).items.length, 6);
});

test("the restore drill restores the newest verified backup into a new folder and compares the answers on a fixed day", async () => {
  const live = freshFolder();
  const repository = await seeded(live);
  // The fixed day of the drill is TODAY; null runs it without one.
  const run = (script: string, args: string[] = [], today: string | null = "2026-03-01") => {
    const env: Record<string, string | undefined> = { ...process.env, DATA_DIR: live, TODAY: today ?? undefined };
    if (today === null) {
      delete env.TODAY;
    }
    return spawnSync(process.execPath, [...TS, path.join(SRC, script), ...args], { env: env, encoding: "utf8" });
  };
  assert.equal(run("backup-store.ts").status, 0);
  const drill = run("restore-drill.ts", [freshFolder()]);
  assert.equal(drill.status, 0, drill.stdout + drill.stderr);
  assert.match(drill.stdout, /✔ the restored store answers the same/);
  assert.match(drill.stdout, /live: {5}6 habits, 10 completion days, streaks on 2026-03-01 [0-9a-f]{12}, ids [0-9a-f]{12}/);
  const noDay = run("restore-drill.ts", [freshFolder()], null);
  assert.equal(noDay.status, 1);
  assert.match(noDay.stderr, /TODAY is required/);
  assert.equal(run("restore-drill.ts", [live]).status, 1);
  // A day added after the backup changes only the completions and a streak, not the count or the ids.
  await repository.update("h-03", (habit) => ({ ...habit, completions: ["2026-02-28", ...habit.completions] }));
  const later = run("restore-drill.ts", [freshFolder()]);
  assert.equal(later.status, 1);
  assert.match(later.stdout, /✖ the restored store answers differently/);
});

test("a sorted page of 20,000 synthetic habits stays within the latency budget", async (t) => {
  const repository = createFileRepository(freshFolder());
  // 20,000 habits with a month of completions each, as `npm run synth` makes them.
  await repository.seed((makeSyntheticHabits(20_000, 30) as Habit[]).map((habit, index) => ({ ...habit, id: `h-${101 + index}` })));
  const base = await startServer(t, repository);
  const durations: number[] = [];
  for (let i = 0; i < 23; i++) {
    const started = performance.now();
    await (await fetch(`${base}/v1/records?sort=name&limit=20`)).text();
    if (i >= 3) {
      durations.push(performance.now() - started);
    }
  }
  const p95 = durations.toSorted((a, b) => a - b)[Math.ceil(0.95 * durations.length) - 1];
  assert.ok(p95 < LATENCY_BUDGET_MS, `p95 ${p95.toFixed(1)} ms is above ${LATENCY_BUDGET_MS} ms on 20,000 habits`);
});

// Measured on the reference machine (see docs/server.md, NO-12) and set well above it, so a slower computer
// passes while work that grows much faster than the data (a sort inside a loop) does not.
const LATENCY_BUDGET_MS = 400;
