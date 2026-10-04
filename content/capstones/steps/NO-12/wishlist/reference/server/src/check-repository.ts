// Checks the repository with real files and a real crash: `npm run check` in server/. It works in
// server/.check/ (deleted at the start, not in Git), prints one ✔ or ✖ line per check and ends with
// exit code 1 when a check fails. The crash check starts src/acquire.ts as a child process with
// CRASH_BEFORE_RENAME=1, so the process really dies between the temp-file write and the rename.
import { spawnSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createFileRepository, DATA_FILE_NAME } from "./fileRepository.ts";
import { resolveInside } from "./files.ts";
import { loadFixtures } from "./fixtures.ts";

const CHECK_DIR = path.join(import.meta.dirname, "..", ".check");
const ACQUIRE = path.join(import.meta.dirname, "acquire.ts");

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
  assert(resolveInside(base, "wishlist.json") === path.join(base, "wishlist.json"), "wishlist.json must stay inside");
  assert(resolveInside(base, "archive/../wishlist.json") === path.join(base, "wishlist.json"), "archive/../wishlist.json must stay inside");
  for (const name of ["../wishlist.json", "../../config/.env", "/etc/hosts", "../paths-backup/wishlist.json", "archive/../../wishlist.json", "."]) {
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
  assert((await repository.list()).length === 6, "after the seed: 6 wishes");
});

check("a save is read back after a restart, with no temp file left", async () => {
  const dir = await freshDir("save");
  await createFileRepository(dir).seed(await loadFixtures());
  const first = createFileRepository(dir);
  const wish = await first.get("w-02");
  assert(wish !== null, "w-02 must exist");
  await first.save({ ...wish!, acquired: true });
  const again = createFileRepository(dir); // a new repository object: nothing is kept in memory
  assert((await again.get("w-02"))?.acquired === true, "w-02 must be acquired after the restart");
  assert((await again.list()).map((one) => one.id).join() === "w-01,w-02,w-03,w-04,w-05,w-06", "the order of the wishes must not change");
  assert((await readdir(dir)).join() === DATA_FILE_NAME, "only the data file must be left");
});

check("a crash between the temp-file write and the rename keeps the last complete file", async () => {
  const dir = await freshDir("crash");
  await createFileRepository(dir).seed(await loadFixtures());
  const before = await readFile(path.join(dir, DATA_FILE_NAME), "utf8");
  const child = spawnSync(process.execPath, [...process.execArgv, ACQUIRE, "w-02"], {
    env: { ...process.env, DATA_DIR: dir, CRASH_BEFORE_RENAME: "1" },
    encoding: "utf8",
  });
  assert(child.signal === "SIGKILL", `the child must be killed by SIGKILL, got status ${child.status} and signal ${child.signal}`);
  const names = await readdir(dir);
  assert(names.some((name) => name.endsWith(".tmp")), "the crash must leave a *.tmp file");
  assert((await readFile(path.join(dir, DATA_FILE_NAME), "utf8")) === before, "the data file must be the old one, byte for byte");
  const restarted = createFileRepository(dir);
  assert((await restarted.recover()).length === 1, "recover() must remove the one temp file");
  assert((await restarted.get("w-02"))?.acquired === false, "after the restart w-02 must be wanted, as in the last complete file");
  assert((await readdir(dir)).join() === DATA_FILE_NAME, "only the data file must be left");
});

check("a data file bigger than maxBytes is refused before it is read", async () => {
  const dir = await freshDir("big");
  await writeFile(path.join(dir, DATA_FILE_NAME), JSON.stringify({ schemaVersion: 2, records: [], pad: "x".repeat(500) }));
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
    await small.save({ id: "w-99", name: "x".repeat(80), price: 1, acquired: false, category: null });
    assert(false, "save() must reject");
  } catch (error) {
    assert(error instanceof RangeError, `expected a RangeError, got ${(error as Error).name}: ${(error as Error).message}`);
  }
  assert((await readFile(path.join(dir, DATA_FILE_NAME), "utf8")) === before, "the data file must not change");
});

check("a damaged data file is an error with its cause, not an empty list", async () => {
  const dir = await freshDir("damaged");
  await writeFile(path.join(dir, DATA_FILE_NAME), '{"schemaVersion": 2, "records": [');
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
  await repository.save({ id: "w-01", name: name, price: 5, acquired: false, category: null });
  assert((await createFileRepository(dir).get("w-01"))?.name === name, "the name must come back unchanged");
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
