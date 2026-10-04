// Tests of the durable store with node:test: the contract, the migration from version 1 to 2, the
// start (seed, refusals, recovery), verified backups and simultaneous changes. Every test works in its
// own folder under server/.check/storage/ with real files. The pending-due count is always made for a
// fixed day, so a test gives the same answer on any calendar day.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { countDueTasks } from "../../domain/tasks.ts";
import { backupStore, recoverStore, verifyBackup } from "../src/backup.ts";
import { loadConfig } from "../src/config.ts";
import type { Config } from "../src/config.ts";
import { ContractError, parseStore } from "../src/contract.ts";
import { createFileRepository, DATA_FILE_NAME } from "../src/fileRepository.ts";
import { dryRun, facts, migrate1to2, storeFacts } from "../src/migrate.ts";
import type { AnyStore } from "../src/migrate.ts";
import { backupsDirOf, dayOf, initStore } from "../src/open.ts";
import { createRecordsServer } from "../src/server.ts";

const MIGRATE = path.join(import.meta.dirname, "..", "src", "migrate-store.ts");
const DAY = "2026-03-02";

async function freshConfig(): Promise<Config> {
  const dataDir = path.join(import.meta.dirname, "..", ".check", "storage", randomUUID());
  await mkdir(dataDir, { recursive: true });
  const config = loadConfig({ DATA_DIR: dataDir });
  assert.ok(config.ok);
  return config.value;
}

const fileOf = (config: Config) => path.join(config.dataDir, DATA_FILE_NAME);

// A version 1 store as older code could leave it: no `priority` (it meant normal), "" as no due date.
const V1 = {
  schemaVersion: 1,
  records: [
    { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-02", done: false, priority: "normal" },
    { id: "t-02", title: "%%fixture2Name%%", dueDate: "2026-03-01", done: false },
    { id: "t-03", title: "%%fixture3Name%%", dueDate: "", done: false, priority: "low" },
  ],
};

test("migrate1to2: a missing priority becomes normal, an empty dueDate null, and the input is not changed", () => {
  const input = structuredClone(V1);
  const result = migrate1to2(input);
  assert.deepEqual(result, {
    schemaVersion: 2,
    records: [
      { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-02", done: false, priority: "normal" },
      { id: "t-02", title: "%%fixture2Name%%", dueDate: "2026-03-01", done: false, priority: "normal" },
      { id: "t-03", title: "%%fixture3Name%%", dueDate: null, done: false, priority: "low" },
    ],
  });
  assert.deepEqual(input, V1);
  assert.deepEqual(migrate1to2(result), result); // a version 2 store is returned as it is
});

test("a record that cannot be moved stops the whole migration; dryRun reports it without throwing", () => {
  const broken = structuredClone(V1) as AnyStore & { records: Record<string, unknown>[] };
  broken.records[1].dueDate = "01.03.2026";
  assert.throws(() => migrate1to2(broken), (error: unknown) => error instanceof ContractError && error.problems.includes("records[1].dueDate: notCalendarDate"));
  const report = dryRun(broken, DAY);
  assert.equal(report.ok, false);
  assert.throws(() => migrate1to2({ schemaVersion: 3, records: [] }), /cannot migrate schemaVersion 3/);
});

test("a due date of the right form that is no real day (2026-02-31) stops the whole migration", () => {
  const broken = structuredClone(V1) as AnyStore & { records: Record<string, unknown>[] };
  broken.records[0].dueDate = "2026-02-31";
  assert.throws(() => migrate1to2(broken), (error: unknown) => error instanceof ContractError && error.problems.includes("records[0].dueDate: notRealDate"));
  const report = dryRun(broken, DAY);
  assert.equal(report.ok, false);
  assert.equal(!report.ok && report.problem.includes("notRealDate"), true);
});

test("dryRun keeps the count, the ids and the pending-due count, and catches a migration that loses or changes them", () => {
  const good = dryRun(V1, DAY);
  assert.equal(good.ok, true);
  assert.equal(good.ok && good.count, 3);
  const dropsOne = (store: AnyStore) => {
    const moved = migrate1to2(store);
    return { ...moved, records: moved.records.slice(1) };
  };
  assert.equal(dryRun(V1, DAY, dropsOne).ok, false);
  const completesAll = (store: AnyStore) => {
    const moved = migrate1to2(store);
    return { ...moved, records: moved.records.map((task) => ({ ...task, done: true })) };
  };
  assert.equal(dryRun(V1, DAY, completesAll).ok, false); // the pending-due count would drop to 0
});

test("the raw version 1 facts count leniently and give the domain's countDueTasks number for the same day", () => {
  const raw = facts(V1.records, DAY);
  assert.deepEqual(raw, { count: 3, ids: "t-01,t-02,t-03", pendingDue: 2 }); // "" is no due date, never due
  const moved = migrate1to2(V1);
  assert.deepEqual(storeFacts(moved, DAY), raw);
  assert.equal(storeFacts(moved, DAY).pendingDue, countDueTasks(moved.records, DAY));
  assert.equal(storeFacts(moved, "2026-02-28").pendingDue, 0); // the day is a parameter, not today
  const config = loadConfig({ TODAY: "2026-03-05" });
  assert.ok(config.ok);
  assert.equal(dayOf(config.value), "2026-03-05");
  assert.equal(dayOf({ ...config.value, today: null }, new Date(2026, 2, 1, 0, 30)), "2026-03-01"); // the local day
});

test("the contract collects every problem: unknown and missing fields, an empty dueDate, duplicate ids", () => {
  const text = JSON.stringify({
    schemaVersion: 2,
    records: [
      { id: "t-01", title: "A", dueDate: "", done: false, priority: "normal", isAdmin: true },
      { id: "t-01", title: "B", dueDate: null, priority: "low" },
    ],
  });
  assert.throws(() => parseStore(text), (error: unknown) => {
    assert.ok(error instanceof ContractError);
    assert.deepEqual(error.problems.sort(), ["records: duplicate id t-01", "records[0].dueDate: empty", "records[0].isAdmin: unknown", "records[1].done: required"]);
    return true;
  });
  assert.throws(() => parseStore('{"schemaVersion":2,"records":{}}'), (error: unknown) => error instanceof ContractError && error.problems.includes("records: notArray"));
});

test("the first start seeds six tasks; a task deleted later does not come back after a restart", async () => {
  const config = await freshConfig();
  const first = await initStore(config);
  assert.equal(first.seeded, true);
  assert.equal((await first.repository.list()).length, 6);
  assert.equal(await first.repository.remove("t-03"), true);
  const again = await initStore(config);
  assert.equal(again.seeded, false);
  assert.deepEqual((await again.repository.list()).map((task) => task.id), ["t-01", "t-02", "t-04", "t-05", "t-06"]);
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
  broken.records[0].dueDate = "2026-02-31";
  await writeFile(fileOf(config), JSON.stringify(broken));
  assert.equal(run().status, 1);
  assert.equal(await readFile(fileOf(config), "utf8"), JSON.stringify(broken));
  await writeFile(fileOf(config), JSON.stringify(V1));
  assert.equal(run().status, 0);
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
  assert.equal(manifest.pendingDue, 2);
  assert.equal(manifest.day, DAY);
  const scratch = path.join(config.dataDir, "scratch");
  assert.deepEqual(await verifyBackup(backupPath, scratch), { ok: true, count: 6, problems: [] });
  assert.equal(await readFile(fileOf(config), "utf8"), await readFile(backupPath, "utf8")); // the live store is untouched
  await writeFile(backupPath, (await readFile(backupPath, "utf8")).replace('"dueDate": "2026-03-02"', '"dueDate": "2026-03-03"'));
  const changed = await verifyBackup(backupPath, scratch);
  assert.equal(changed.ok, false);
  assert.ok(changed.problems.some((problem) => problem.startsWith("sha256")));
  const missing = await verifyBackup(path.join(backupsDir, "nothing.json"), scratch);
  assert.equal(missing.ok, false);
});

test("a backup is checked for the day in its manifest: the same copy does not verify against another day's count", async () => {
  const config = await freshConfig();
  await initStore(config);
  const { backupPath } = await backupStore(fileOf(config), backupsDirOf(config), "2026-10-04T10-00-00-000Z", DAY);
  const scratch = path.join(config.dataDir, "scratch");
  assert.equal((await verifyBackup(backupPath, scratch)).ok, true);
  const manifestPath = `${backupPath}.manifest.json`;
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await writeFile(manifestPath, JSON.stringify({ ...manifest, day: "2026-03-10" })); // t-05 is due by then: 3, not 2
  const otherDay = await verifyBackup(backupPath, scratch);
  assert.equal(otherDay.ok, false);
  assert.deepEqual(otherDay.problems, ["pendingDue: manifest 2, restored 3"]);
});

test("a damaged store is moved aside and the newest VERIFIED backup restored; the report names the lost tasks", async () => {
  const config = await freshConfig();
  const opened = await initStore(config);
  const backupsDir = backupsDirOf(config);
  await backupStore(fileOf(config), backupsDir, "2026-10-04T09-00-00-000Z", DAY); // six tasks
  await opened.repository.save({ id: "t-07", title: "%%fixture1Name%% 2", dueDate: null, done: false, priority: "normal" });
  await backupStore(fileOf(config), backupsDir, "2026-10-04T10-00-00-000Z", DAY); // seven tasks
  await opened.repository.save({ id: "t-08", title: "%%fixture2Name%% 2", dueDate: null, done: false, priority: "normal" });
  const newest = await backupStore(fileOf(config), backupsDir, "2026-10-04T11-00-00-000Z", DAY); // eight tasks
  await opened.repository.save({ id: "t-09", title: "%%fixture6Name%% 2", dueDate: null, done: false, priority: "normal" });
  const damaged = (await readFile(fileOf(config), "utf8")).replace('"done": false', '"done": "no"');
  await writeFile(fileOf(config), damaged);
  await writeFile(newest.backupPath, (await readFile(newest.backupPath, "utf8")) + " "); // the newest no longer verifies
  const report = await recoverStore(fileOf(config), backupsDir, "2026-10-04T12-00-00-000Z");
  assert.deepEqual(report, {
    action: "restored",
    quarantined: `${DATA_FILE_NAME}.corrupt-2026-10-04T12-00-00-000Z`,
    restoredFrom: "planner.2026-10-04T10-00-00-000Z.json",
    count: 7,
    notInBackup: ["t-08", "t-09"],
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
      fetch(`${base}/v1/records`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: `%%fixture1Name%% ${index}` }), signal: AbortSignal.timeout(5000) }).then((response) => response.json()),
    ),
  );
  assert.equal(new Set(answers.map((task) => task.id)).size, 20);
  assert.equal((await repository.list()).length, 26);
});
