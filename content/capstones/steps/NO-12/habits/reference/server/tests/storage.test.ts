// Tests of the durable store with node:test: the contract, the migration from version 1 to 2, the
// start (seed, refusals, recovery), verified backups and simultaneous changes. Every test works in its
// own folder under server/.check/storage/ with real files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { backupStore, recoverStore, verifyBackup } from "../src/backup.ts";
import { loadConfig } from "../src/config.ts";
import type { Config } from "../src/config.ts";
import { ContractError, parseStore } from "../src/contract.ts";
import { createFileRepository, DATA_FILE_NAME } from "../src/fileRepository.ts";
import { dryRun, facts, migrate1to2, storeFacts } from "../src/migrate.ts";
import type { AnyStore } from "../src/migrate.ts";
import { backupsDirOf, initStore } from "../src/open.ts";
import { createRecordsServer } from "../src/server.ts";

const MIGRATE = path.join(import.meta.dirname, "..", "src", "migrate-store.ts");

// The fixed day of the facts: the streaks depend on it, so a test never counts on the real today.
const DAY = "2026-03-01";

async function freshConfig(): Promise<Config> {
  const dataDir = path.join(import.meta.dirname, "..", ".check", "storage", randomUUID());
  await mkdir(dataDir, { recursive: true });
  const config = loadConfig({ DATA_DIR: dataDir });
  assert.ok(config.ok);
  return config.value;
}

const fileOf = (config: Config) => path.join(config.dataDir, DATA_FILE_NAME);

// A version 1 store as older code could leave it: no `frequency` (daily), a day twice and out of order.
const V1 = {
  schemaVersion: 1,
  records: [
    { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-27", "2026-02-28", "2026-03-01"] },
    { id: "h-02", name: "%%fixture2Name%%", active: true, completions: ["2026-03-01", "2026-02-28", "2026-03-01", "2026-02-26"] },
    { id: "h-04", name: "%%fixture4Name%%", frequency: "weekly", active: false, completions: ["2026-02-22", "2026-03-01"] },
  ],
};

test("migrate1to2: a missing frequency becomes daily, the completions unique and ascending, and the input is not changed", () => {
  const input = structuredClone(V1);
  const result = migrate1to2(input);
  assert.deepEqual(result, {
    schemaVersion: 2,
    records: [
      { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-27", "2026-02-28", "2026-03-01"] },
      { id: "h-02", name: "%%fixture2Name%%", frequency: "daily", active: true, completions: ["2026-02-26", "2026-02-28", "2026-03-01"] },
      { id: "h-04", name: "%%fixture4Name%%", frequency: "weekly", active: false, completions: ["2026-02-22", "2026-03-01"] },
    ],
  });
  assert.deepEqual(input, V1);
  assert.deepEqual(migrate1to2(result), result); // a version 2 store is returned as it is
});

test("a record that cannot be moved stops the whole migration; dryRun reports it without throwing", () => {
  const broken = structuredClone(V1) as AnyStore & { records: Record<string, unknown>[] };
  broken.records[1].active = "yes";
  assert.throws(() => migrate1to2(broken), (error: unknown) => error instanceof ContractError && error.problems.includes("records[1].active: notBoolean"));
  const report = dryRun(broken, DAY);
  assert.equal(report.ok, false);
  assert.throws(() => migrate1to2({ schemaVersion: 3, records: [] }), /cannot migrate schemaVersion 3/);
});

test("dryRun keeps the count, the ids, the completion days and the streaks, and catches a migration that loses or changes them", () => {
  const good = dryRun(V1, DAY);
  assert.equal(good.ok, true);
  assert.equal(good.ok && good.count, 3);
  const dropsOne = (store: AnyStore) => {
    const moved = migrate1to2(store);
    return { ...moved, records: moved.records.slice(1) };
  };
  assert.equal(dryRun(V1, DAY, dropsOne).ok, false);
  const losesToday = (store: AnyStore) => {
    const moved = migrate1to2(store);
    return { ...moved, records: moved.records.map((habit) => ({ ...habit, completions: habit.completions.filter((day) => day !== DAY) })) };
  };
  assert.equal(dryRun(V1, DAY, losesToday).ok, false); // three days fewer, and every streak changes
});

test("the contract collects every problem: unknown and missing fields, duplicate and unsorted completions, duplicate ids", () => {
  const text = JSON.stringify({
    schemaVersion: 2,
    records: [
      { id: "h-01", name: "A", frequency: "daily", active: true, completions: ["2026-03-01", "2026-03-01"], isAdmin: true },
      { id: "h-01", name: "B", active: true, completions: ["2026-03-01", "2026-02-28"] },
    ],
  });
  assert.throws(() => parseStore(text), (error: unknown) => {
    assert.ok(error instanceof ContractError);
    assert.deepEqual(error.problems.sort(), ["records: duplicate id h-01", "records[0].completions: duplicateDate", "records[0].isAdmin: unknown", "records[1].completions: notSorted", "records[1].frequency: required"]);
    return true;
  });
  assert.throws(() => parseStore('{"schemaVersion":2,"records":{}}'), (error: unknown) => error instanceof ContractError && error.problems.includes("records: notArray"));
});

test("the first start seeds six habits; a habit deleted later does not come back after a restart", async () => {
  const config = await freshConfig();
  const first = await initStore(config);
  assert.equal(first.seeded, true);
  assert.equal((await first.repository.list()).length, 6);
  assert.equal(await first.repository.remove("h-03"), true);
  const again = await initStore(config);
  assert.equal(again.seeded, false);
  assert.deepEqual((await again.repository.list()).map((habit) => habit.id), ["h-01", "h-02", "h-04", "h-05", "h-06"]);
  assert.equal(JSON.parse(await readFile(fileOf(config), "utf8")).schemaVersion, 2);
});

test("the start refuses a version 1 store and a newer version, and leaves the file as it was", async () => {
  const config = await freshConfig();
  for (const store of [V1, { schemaVersion: 3, records: [] }]) {
    const text = JSON.stringify(store);
    await writeFile(fileOf(config), text);
    await assert.rejects(initStore(config), store.schemaVersion === 1 ? /npm run migrate/ : /newer than this program knows/);
    assert.equal(await readFile(fileOf(config), "utf8"), text);
  }
});

test("npm run migrate replaces a version 1 file only after a dry run; a failed dry run touches nothing", async () => {
  const config = await freshConfig();
  const run = () => spawnSync(process.execPath, [...process.execArgv, MIGRATE], { env: { ...process.env, DATA_DIR: config.dataDir, TODAY: DAY }, encoding: "utf8" });
  const broken = structuredClone(V1) as { schemaVersion: number; records: Record<string, unknown>[] };
  broken.records[0].name = "";
  await writeFile(fileOf(config), JSON.stringify(broken));
  assert.equal(run().status, 1);
  assert.equal(await readFile(fileOf(config), "utf8"), JSON.stringify(broken));
  await writeFile(fileOf(config), JSON.stringify(V1));
  const migrated = run();
  assert.equal(migrated.status, 0);
  assert.match(migrated.stdout, /Dry run on 2026-03-01: 3 habits, the same ids, 8 completion days and streaks h-01:3,h-02:2,h-04:1/);
  assert.deepEqual(parseStore(await readFile(fileOf(config), "utf8")), migrate1to2(V1));
  assert.deepEqual((await readdir(config.dataDir)).sort(), [DATA_FILE_NAME]); // no temp file, no copy left
  const opened = await initStore(config);
  assert.equal((await opened.repository.list()).length, 3);
});

test("a backup verifies by a restore into a scratch folder; a changed byte or a missing manifest fails without throwing", async () => {
  const config = await freshConfig();
  await initStore(config);
  const backupsDir = backupsDirOf(config);
  const { backupPath, manifest } = await backupStore(fileOf(config), backupsDir, "2026-10-04T10-00-00-000Z", DAY);
  assert.equal(manifest.count, 6);
  assert.equal(manifest.completions, 10);
  assert.equal(manifest.streaks, "h-01:3,h-02:2,h-03:1,h-04:1,h-05:0,h-06:0");
  const scratch = path.join(config.dataDir, "scratch");
  assert.deepEqual(await verifyBackup(backupPath, scratch), { ok: true, count: 6, problems: [] });
  assert.equal(await readFile(fileOf(config), "utf8"), await readFile(backupPath, "utf8")); // the live store is untouched
  await writeFile(backupPath, (await readFile(backupPath, "utf8")).replace('"2026-02-27"', '"2026-02-25"'));
  const changed = await verifyBackup(backupPath, scratch);
  assert.equal(changed.ok, false);
  assert.ok(changed.problems.some((problem) => problem.startsWith("sha256")));
  const missing = await verifyBackup(path.join(backupsDir, "nothing.json"), scratch);
  assert.equal(missing.ok, false);
});

test("a damaged store is moved aside and the newest VERIFIED backup restored; the report names the lost habits", async () => {
  const config = await freshConfig();
  const opened = await initStore(config);
  const backupsDir = backupsDirOf(config);
  await backupStore(fileOf(config), backupsDir, "2026-10-04T09-00-00-000Z", DAY); // six habits
  await opened.repository.save({ id: "h-07", name: "%%fixture1Name%% 2", frequency: "daily", active: true, completions: [] });
  await backupStore(fileOf(config), backupsDir, "2026-10-04T10-00-00-000Z", DAY); // seven habits
  await opened.repository.save({ id: "h-08", name: "%%fixture2Name%% 2", frequency: "daily", active: true, completions: [] });
  const newest = await backupStore(fileOf(config), backupsDir, "2026-10-04T11-00-00-000Z", DAY); // eight habits
  await opened.repository.save({ id: "h-09", name: "%%fixture6Name%% 2", frequency: "weekly", active: true, completions: [] });
  const damaged = (await readFile(fileOf(config), "utf8")).replace('"active": true', '"active": "true"');
  await writeFile(fileOf(config), damaged);
  await writeFile(newest.backupPath, (await readFile(newest.backupPath, "utf8")) + " "); // the newest no longer verifies
  const report = await recoverStore(fileOf(config), backupsDir, "2026-10-04T12-00-00-000Z");
  assert.deepEqual(report, {
    action: "restored",
    quarantined: `${DATA_FILE_NAME}.corrupt-2026-10-04T12-00-00-000Z`,
    restoredFrom: "habits.2026-10-04T10-00-00-000Z.json",
    count: 7,
    notInBackup: ["h-08", "h-09"],
  });
  assert.equal(await readFile(path.join(config.dataDir, report.quarantined), "utf8"), damaged); // kept as evidence
  assert.equal((await initStore(config)).recovery.action, "ok");
});

test("a damaged store without a verified backup refuses the start and stays where it is", async () => {
  const config = await freshConfig();
  await writeFile(fileOf(config), '{"schemaVersion": 2, "records": [');
  await assert.rejects(initStore(config), /no verified backup/);
  await assert.rejects(createFileRepository(config.dataDir).list(), ContractError); // damaged is never "no records"
  assert.deepEqual(await readdir(config.dataDir), [DATA_FILE_NAME]);
  assert.equal(await readFile(fileOf(config), "utf8"), '{"schemaVersion": 2, "records": [');
});

test("twenty creates at the same moment get twenty different ids, and all of them are stored", async (t) => {
  const config = await freshConfig();
  const { repository } = await initStore(config);
  const server = createRecordsServer(repository, () => {});
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const answers = await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      fetch(`${base}/v1/records`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: `%%fixture1Name%% ${index}` }), signal: AbortSignal.timeout(5000) }).then((response) => response.json()),
    ),
  );
  assert.equal(new Set(answers.map((habit) => habit.id)).size, 20);
  assert.equal((await repository.list()).length, 26);
});

// ---------- the rules of the habit store ----------

test("a completion that is not a real date stops the whole migration, even when its form is right", () => {
  for (const day of ["2026-02-30", "2026-13-01"]) {
    const broken = structuredClone(V1) as AnyStore & { records: Record<string, unknown>[] };
    broken.records[2].completions = ["2026-02-22", day];
    assert.throws(() => migrate1to2(broken), (error: unknown) => error instanceof ContractError && error.problems.includes("records[2].completions: notRealDate"));
    assert.equal(dryRun(broken, DAY).ok, false);
  }
  const badForm = structuredClone(V1) as AnyStore & { records: Record<string, unknown>[] };
  badForm.records[0].completions = ["2026-3-1"];
  assert.throws(() => migrate1to2(badForm), (error: unknown) => error instanceof ContractError && error.problems.includes("records[0].completions: notCalendarDates"));
});

test("version 2 never repairs completions: a day twice or out of order is refused on read and before a write", async () => {
  const config = await freshConfig();
  const { repository } = await initStore(config);
  const before = await readFile(fileOf(config), "utf8");
  await assert.rejects(repository.save({ id: "h-03", name: "%%fixture3Name%%", frequency: "daily", active: true, completions: ["2026-03-01", "2026-03-01"] }), (error: unknown) => error instanceof ContractError && error.problems.includes("records[2].completions: duplicateDate"));
  assert.equal(await readFile(fileOf(config), "utf8"), before);
  const unsorted = JSON.parse(before);
  unsorted.records[0].completions.reverse();
  assert.throws(() => migrate1to2(unsorted), (error: unknown) => error instanceof ContractError && error.problems.includes("records[0].completions: notSorted"));
});

test("the facts count each completion day once and the streaks on the given day; the raw version 1 facts equal the migrated ones", () => {
  const raw = facts(V1.records, DAY);
  assert.deepEqual(raw, { count: 3, ids: "h-01,h-02,h-04", completions: 8, streaks: "h-01:3,h-02:2,h-04:1" });
  assert.deepEqual(storeFacts(migrate1to2(V1), DAY), raw);
  // A later day sees days after it no longer: the same store, other streaks.
  assert.equal(facts(V1.records, "2026-02-28").streaks, "h-01:2,h-02:1,h-04:0");
  assert.equal(facts(V1.records, "2026-03-05").streaks, "h-01:0,h-02:0,h-04:0");
});

test("a backup keeps its day: verifyBackup recounts the streaks on the manifest's day, never on today", async () => {
  const config = await freshConfig();
  await initStore(config);
  const backupsDir = backupsDirOf(config);
  const { backupPath, manifest } = await backupStore(fileOf(config), backupsDir, "2026-10-04T10-00-00-000Z", DAY);
  assert.equal(manifest.day, DAY);
  const scratch = path.join(config.dataDir, "scratch");
  assert.equal((await verifyBackup(backupPath, scratch)).ok, true); // today is long after DAY, and it still verifies
  const manifestFile = `${backupPath}.manifest.json`;
  await writeFile(manifestFile, JSON.stringify({ ...manifest, day: "2026-02-28" }));
  const otherDay = await verifyBackup(backupPath, scratch);
  assert.equal(otherDay.ok, false);
  assert.ok(otherDay.problems.some((problem) => problem.startsWith("streaks")));
  await writeFile(manifestFile, JSON.stringify({ ...manifest, day: undefined }));
  const noDay = await verifyBackup(backupPath, scratch);
  assert.equal(noDay.ok, false);
  assert.ok(noDay.problems.some((problem) => problem.startsWith("day")));
});
