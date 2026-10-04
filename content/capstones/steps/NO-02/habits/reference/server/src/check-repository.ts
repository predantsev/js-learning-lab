// Checks the repository with real files and a real crash: `npm run check` in server/. It works in
// server/.check/ (deleted at the start, not in Git), prints one ✔ or ✖ line per check and ends with
// exit code 1 when a check fails. The crash check starts src/complete-habit.ts as a child process with
// CRASH_BEFORE_RENAME=1, so the process really dies between the temp-file write and the rename.
import { spawnSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createFileRepository, DATA_FILE_NAME } from "./fileRepository.ts";
import { resolveInside } from "./files.ts";
import { loadFixtures } from "./fixtures.ts";
import { completeHabit } from "../../domain/habits.ts";

const CHECK_DIR = path.join(import.meta.dirname, "..", ".check");
const CHANGE = path.join(import.meta.dirname, "complete-habit.ts");

type Check = { name: string; run: () => Promise<void> };
const checks: Check[] = [];
function check(name: string, run: () => Promise<void>): void {
  checks.push({ name: name, run: run });
}
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}
// A fresh folder for every check, so one check cannot depend on another.
async function freshDir(name: string): Promise<string> {
  const dir = path.join(CHECK_DIR, name);
  await mkdir(dir, { recursive: true });
  return dir;
}

check("resolveInside keeps names inside the data folder and refuses the rest", async () => {
  const base = await freshDir("paths");
  assert(resolveInside(base, "habits.json") === path.join(base, "habits.json"), "habits.json must stay inside");
  assert(resolveInside(base, "archive/../habits.json") === path.join(base, "habits.json"), "archive/../habits.json must stay inside");
  for (const name of ["../habits.json", "../../config/.env", "/etc/hosts", "../paths-backup/habits.json", "archive/../../habits.json", "."]) {
    let refused = false;
    try {
      resolveInside(base, name);
    } catch {
      refused = true;
    }
    assert(refused, `"${name}" must be refused`);
  }
});

check("a missing data file means no records yet, and seed fills it once", async () => {
  const repository = createFileRepository(await freshDir("seed"));
  assert((await repository.list()).length === 0, "list() of a missing file must be []");
  assert((await repository.seed(await loadFixtures())) === true, "the first seed must write");
  assert((await repository.seed([])) === false, "a second seed must not write");
  assert((await repository.list()).length === 6, "after the seed: 6 records");
});

check("a save is read back after a restart, with no temp file left", async () => {
  const dir = await freshDir("save");
  await createFileRepository(dir).seed(await loadFixtures());
  const first = createFileRepository(dir);
  const habit = await first.get("h-03");
  assert(habit !== null, "h-03 must exist");
  const [changed] = completeHabit([habit!], "h-03", "2026-02-28");
  await first.save(changed);
  const again = createFileRepository(dir); // a new repository object: nothing is kept in memory
  assert((await again.get("h-03"))?.completions.join() === "2026-02-28,2026-03-01", "h-03 completions must be unique and sorted after the restart");
  assert((await again.list()).map((one) => one.id).join() === "h-01,h-02,h-03,h-04,h-05,h-06", "the order of the habits must not change");
  assert((await readdir(dir)).join() === DATA_FILE_NAME, "only the data file must be left");
});

check("a crash between the temp-file write and the rename keeps the last complete file", async () => {
  const dir = await freshDir("crash");
  await createFileRepository(dir).seed(await loadFixtures());
  const before = await readFile(path.join(dir, DATA_FILE_NAME), "utf8");
  const child = spawnSync(process.execPath, [...process.execArgv, CHANGE, "h-03"], {
    env: { ...process.env, DATA_DIR: dir, CRASH_BEFORE_RENAME: "1", TODAY: "2026-03-02" },
    encoding: "utf8",
  });
  assert(child.signal === "SIGKILL", `the child must be killed by SIGKILL, got status ${child.status} and signal ${child.signal}`);
  const names = await readdir(dir);
  assert(names.some((name) => name.endsWith(".tmp")), "the crash must leave a *.tmp file");
  assert((await readFile(path.join(dir, DATA_FILE_NAME), "utf8")) === before, "the data file must be the old one, byte for byte");
  const restarted = createFileRepository(dir);
  assert((await restarted.recover()).length === 1, "recover() must remove the one temp file");
  assert((await restarted.get("h-03"))?.completions.join() === "2026-03-01", "after the restart h-03 completions must be the old ones, whole");
  assert((await readdir(dir)).join() === DATA_FILE_NAME, "only the data file must be left");
});

check("a data file bigger than maxBytes is refused before it is read", async () => {
  const dir = await freshDir("big");
  await writeFile(path.join(dir, DATA_FILE_NAME), JSON.stringify({ schemaVersion: 1, records: [], pad: "x".repeat(500) }));
  try {
    await createFileRepository(dir, { maxBytes: 200 }).list();
    assert(false, "list() must reject");
  } catch (error) {
    assert(error instanceof RangeError, `expected a RangeError, got ${(error as Error).name}: ${(error as Error).message}`);
  }
});

check("a save that would pass maxBytes is refused and changes nothing", async () => {
  const dir = await freshDir("grow");
  await createFileRepository(dir).seed(await loadFixtures());
  const before = await readFile(path.join(dir, DATA_FILE_NAME), "utf8");
  const small = createFileRepository(dir, { maxBytes: Buffer.byteLength(before) + 10 });
  try {
    await small.save({ id: "h-99", name: "x".repeat(80), frequency: "daily", active: true, completions: [] });
    assert(false, "save() must reject");
  } catch (error) {
    assert(error instanceof RangeError, `expected a RangeError, got ${(error as Error).name}: ${(error as Error).message}`);
  }
  assert((await readFile(path.join(dir, DATA_FILE_NAME), "utf8")) === before, "the data file must not change");
});

check("a damaged data file is an error with its cause, not an empty list", async () => {
  const dir = await freshDir("damaged");
  await writeFile(path.join(dir, DATA_FILE_NAME), '{"schemaVersion": 1, "records": [');
  try {
    await createFileRepository(dir).list();
    assert(false, "list() must reject");
  } catch (error) {
    assert((error as Error).cause instanceof SyntaxError, `the cause must be a SyntaxError, got ${String((error as Error).cause)}`);
  }
});

check("Ukrainian names survive a save and a read", async () => {
  const dir = await freshDir("utf8");
  const repository = createFileRepository(dir);
  const name = "Ліхтарик із ґудзиком — «їжак» ✨";
  await repository.save({ id: "h-01", name: name, frequency: "daily", active: true, completions: [] });
  assert((await createFileRepository(dir).get("h-01"))?.name === name, "the text must come back unchanged");
});

await rm(CHECK_DIR, { recursive: true, force: true });
let passed = 0;
for (const { name, run } of checks) {
  try {
    await run();
    passed += 1;
    console.log(`✔ ${name}`);
  } catch (error) {
    console.log(`✖ ${name} — ${(error as Error).message}`);
  }
}
console.log(`${passed} of ${checks.length} checks passed`);
process.exitCode = passed === checks.length ? 0 : 1;
