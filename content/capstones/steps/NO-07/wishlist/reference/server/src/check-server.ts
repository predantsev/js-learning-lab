// Checks the records server as a real process: `npm run check:server` in server/. It starts
// `node src/server.ts` on a free port with its own data folder (server/.check/server), sends real
// requests, stops it with SIGINT, starts it again and compares. One ✔ or ✖ line per check; exit code 1
// when a check fails. Every request has a 2-second timeout, so a branch that never answers fails instead
// of hanging.
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { once } from "node:events";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { rm } from "node:fs/promises";
import path from "node:path";
import { createFileRepository } from "./fileRepository.ts";

const SERVER = path.join(import.meta.dirname, "server.ts");
const DATA_DIR = path.join(import.meta.dirname, "..", ".check", "server");

// A port that is free right now: listen on port 0, read the port the system chose, close again.
async function freePort(): Promise<number> {
  const probe = http.createServer();
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const { port } = probe.address() as AddressInfo;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

type Running = { child: ChildProcess; output: () => string };

// Starts the server and waits (at most 5 s) for its "listening" line.
async function startServer(port: number): Promise<Running> {
  const child = spawn(process.execPath, [...process.execArgv, SERVER], {
    env: { ...process.env, PORT: String(port), DATA_DIR: DATA_DIR },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout!.on("data", (chunk) => (output += chunk));
  child.stderr!.on("data", (chunk) => (output += chunk));
  const started = Date.now();
  while (!output.includes("listening")) {
    if (child.exitCode !== null || Date.now() - started > 5000) {
      child.kill("SIGKILL");
      throw new Error(`the server did not start: ${output.trim() || "no output"}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return { child: child, output: () => output };
}

// Sends SIGINT and waits at most 3 s for the process to end; returns how it ended.
async function stopServer(running: Running): Promise<string> {
  const exited = once(running.child, "exit");
  running.child.kill("SIGINT");
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000).unref());
  const result = await Promise.race([exited, timeout]);
  if (result === null) {
    running.child.kill("SIGKILL");
    return "still running 3 s after SIGINT";
  }
  const [code, signal] = result as [number | null, string | null];
  return signal === null ? `exit code ${code}` : `signal ${signal}`;
}

async function request(url: string, method = "GET") {
  const response = await fetch(url, { method: method, signal: AbortSignal.timeout(2000) });
  const text = await response.text();
  return { status: response.status, headers: response.headers, text: text };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const results: string[] = [];
let failed = 0;
async function check(name: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
    results.push(`✔ ${name}`);
  } catch (error) {
    failed += 1;
    results.push(`✖ ${name} — ${(error as Error).message}`);
  }
}

await rm(DATA_DIR, { recursive: true, force: true });
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
let firstBody = "";
let running: Running | null = null;
try {
  running = await startServer(port);
  await check("GET /records → 200, JSON, the stored wishes", async () => {
    const answer = await request(`${base}/records`);
    assert(answer.status === 200, `status ${answer.status}`);
    assert(answer.headers.get("content-type")?.startsWith("application/json") === true, `content-type ${answer.headers.get("content-type")}`);
    assert(answer.headers.get("content-length") === String(Buffer.byteLength(answer.text)), "content-length must be the length in bytes");
    const stored = await createFileRepository(DATA_DIR).list();
    assert(answer.text === JSON.stringify(stored), "the body must be the records of the data file");
    const fields = Object.keys(JSON.parse(answer.text)[0]).join();
    assert(fields === "id,name,price,acquired,category", `fields ${fields}`);
    firstBody = answer.text;
  });
  await check("GET /records?view=all → 200 (routing by pathname)", async () => {
    assert((await request(`${base}/records?view=all`)).status === 200, "status must be 200");
  });
  await check("GET /nothing-here → 404, JSON", async () => {
    const answer = await request(`${base}/nothing-here`);
    assert(answer.status === 404, `status ${answer.status}`);
    assert(answer.headers.get("content-type")?.startsWith("application/json") === true, `content-type ${answer.headers.get("content-type")}`);
    assert(typeof JSON.parse(answer.text).error === "string", "the body must be { error }");
  });
  await check("DELETE /records → 405 with Allow: GET, JSON", async () => {
    const answer = await request(`${base}/records`, "DELETE");
    assert(answer.status === 405, `status ${answer.status}`);
    assert(answer.headers.get("allow") === "GET", `allow ${answer.headers.get("allow")}`);
    assert(typeof JSON.parse(answer.text).error === "string", "the body must be { error }");
  });
  await check("Ctrl+C (SIGINT) closes the server and the process ends with code 0", async () => {
    const how = await stopServer(running!);
    running = null;
    assert(how === "exit code 0", how);
  });
  await check("after a restart GET /records answers the same wishes", async () => {
    running = await startServer(port);
    const answer = await request(`${base}/records`);
    assert(answer.status === 200 && answer.text === firstBody, "the body after the restart must be the same");
  });
} catch (error) {
  failed += 1;
  results.push(`✖ the server — ${(error as Error).message}`);
} finally {
  if (running !== null) {
    await stopServer(running);
  }
}
for (const line of results) {
  console.log(line);
}
console.log(`${results.length - failed} of ${results.length} checks passed`);
process.exitCode = failed === 0 ? 0 : 1;
