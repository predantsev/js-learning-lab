// Tests of the durable store with node:test: the contract, the migration from version 1 to 2 with its
// quarantine, the start (seed, refusals, recovery), verified backups and simultaneous changes. Every test
// works in its own folder under server/.check/storage/ with real files.
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
import { dryRun, migrate1to2, QUARANTINE_FILE_NAME } from "../src/migrate.ts";
import type { AnyStore } from "../src/migrate.ts";
import { backupsDirOf, initStore } from "../src/open.ts";
import { createRecordsServer } from "../src/server.ts";

const MIGRATE = path.join(import.meta.dirname, "..", "src", "migrate-store.ts");

async function freshConfig(): Promise<Config> {
  const dataDir = path.join(import.meta.dirname, "..", ".check", "storage", randomUUID());
  await mkdir(dataDir, { recursive: true });
  const config = loadConfig({ DATA_DIR: dataDir });
  assert.ok(config.ok);
  return config.value;
}

const fileOf = (config: Config) => path.join(config.dataDir, DATA_FILE_NAME);
const quarantineOf = (config: Config) => path.join(config.dataDir, QUARANTINE_FILE_NAME);
const migrateIn = (config: Config) => spawnSync(process.execPath, [...process.execArgv, MIGRATE], { env: { ...process.env, DATA_DIR: config.dataDir }, encoding: "utf8" });

// A version 1 store as older code could leave it: an amount that is not whole kopiykas, a category the
// project does not have, and a record with both.
const V1 = {
  schemaVersion: 1,
  records: [
    { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
    { id: "e-02", label: "%%fixture2Name%%", amountMinor: 520.5, date: "2026-03-01", category: "transport" },
    { id: "e-03", label: "%%fixture3Name%%", amountMinor: 18000, date: "2026-02-28", category: "coffee" },
    { id: "e-04", label: "%%fixture4Name%%", amountMinor: 9990, date: "2026-02-27", category: "home" },
    { id: "e-05", label: "%%fixture5Name%%", amountMinor: 0, date: "2026-02-27", category: "cinema" },
  ],
};

// A version 1 store that version 2 accepts as it is: nothing to quarantine.
const V1_CLEAN = { schemaVersion: 1, records: [V1.records[0], V1.records[3]] };

test("migrate1to2: an invalid amount or category is quarantined, not dropped, and the input is not changed", () => {
  const input = structuredClone(V1);
  const result = migrate1to2(input);
  assert.deepEqual(result, {
    store: {
      schemaVersion: 2,
      records: [
        { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
        { id: "e-04", label: "%%fixture4Name%%", amountMinor: 9990, date: "2026-02-27", category: "home" },
      ],
    },
    quarantined: [
      { record: V1.records[1], problems: ["amountMinor: notPositiveWhole"] },
      { record: V1.records[2], problems: ["category: unknown"] },
      { record: V1.records[4], problems: ["amountMinor: notPositiveWhole", "category: unknown"] },
    ],
  });
  assert.deepEqual(input, V1);
  assert.deepEqual(migrate1to2(result.store), { store: result.store, quarantined: [] }); // a version 2 store is returned as it is
});

test("a record that can be neither moved nor quarantined, such as a bad date or a missing label, stops the whole migration; dryRun reports it without throwing", () => {
  const broken = structuredClone(V1) as AnyStore & { records: Record<string, unknown>[] };
  broken.records[0].date = "2026-3-1";
  broken.records[1].date = ""; // a bad amount does not save a record that also has a bad date
  delete broken.records[3].label;
  assert.throws(() => migrate1to2(broken), (error: unknown) => {
    assert.ok(error instanceof ContractError);
    assert.deepEqual(error.problems.sort(), ["records[0].date: notCalendarDate", "records[1].amountMinor: notPositiveWhole", "records[1].date: notCalendarDate", "records[3].label: required"]);
    return true;
  });
  const report = dryRun(broken);
  assert.equal(report.ok, false);
  assert.throws(() => migrate1to2({ schemaVersion: 3, records: [] }), /cannot migrate schemaVersion 3/);
});

test("dryRun keeps the count of kept plus quarantined records, the ids and the per-category totals, and catches a migration that loses or changes them", () => {
  const good = dryRun(V1);
  assert.equal(good.ok, true);
  assert.equal(good.ok && good.count, 2);
  assert.equal(good.ok && good.quarantined.length, 3);
  const dropsOne = (store: AnyStore) => {
    const moved = migrate1to2(store);
    return { ...moved, store: { ...moved.store, records: moved.store.records.slice(1) } };
  };
  assert.equal(dryRun(V1, dropsOne).ok, false);
  const dropsTheQuarantine = (store: AnyStore) => ({ ...migrate1to2(store), quarantined: [] });
  assert.equal(dryRun(V1, dropsTheQuarantine).ok, false); // 2 kept + 0 quarantined is not 5
  const allFood = (store: AnyStore) => {
    const moved = migrate1to2(store);
    return { ...moved, store: { ...moved.store, records: moved.store.records.map((expense) => ({ ...expense, category: "food" as const })) } };
  };
  assert.equal(dryRun(V1, allFood).ok, false); // the home total would move to food
});

test("the contract collects every problem: unknown and missing fields, an amount that is not whole kopiykas, duplicate ids", () => {
  const text = JSON.stringify({
    schemaVersion: 2,
    records: [
      { id: "e-01", label: "A", amountMinor: 1, date: "2026-03-01", category: "food", isAdmin: true },
      { id: "e-01", label: "B", amountMinor: 12.5, category: "food" },
    ],
  });
  assert.throws(() => parseStore(text), (error: unknown) => {
    assert.ok(error instanceof ContractError);
    assert.deepEqual(error.problems.sort(), ["records: duplicate id e-01", "records[0].isAdmin: unknown", "records[1].amountMinor: notPositiveWhole", "records[1].date: required"]);
    return true;
  });
  assert.throws(() => parseStore('{"schemaVersion":2,"records":{}}'), (error: unknown) => error instanceof ContractError && error.problems.includes("records: notArray"));
});

test("the first start seeds six expenses; an expense deleted later does not come back after a restart", async () => {
  const config = await freshConfig();
  const first = await initStore(config);
  assert.equal(first.seeded, true);
  assert.equal((await first.repository.list()).length, 6);
  assert.equal(await first.repository.remove("e-03"), true);
  const again = await initStore(config);
  assert.equal(again.seeded, false);
  assert.deepEqual((await again.repository.list()).map((expense) => expense.id), ["e-01", "e-02", "e-04", "e-05", "e-06"]);
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

test("npm run migrate replaces a version 1 file only after a dry run and writes the quarantine file next to it; a failed dry run touches nothing", async () => {
  const config = await freshConfig();
  const broken = structuredClone(V1) as { schemaVersion: number; records: Record<string, unknown>[] };
  broken.records[0].date = "2026-3-1";
  await writeFile(fileOf(config), JSON.stringify(broken));
  assert.equal(migrateIn(config).status, 1);
  assert.equal(await readFile(fileOf(config), "utf8"), JSON.stringify(broken));
  assert.deepEqual(await readdir(config.dataDir), [DATA_FILE_NAME]); // no quarantine file from a failed dry run
  await writeFile(fileOf(config), JSON.stringify(V1));
  const run = migrateIn(config);
  assert.equal(run.status, 0);
  assert.match(run.stdout, new RegExp(`Quarantined 3 expenses in .*${QUARANTINE_FILE_NAME.replace(".", "\\.")}`));
  const expected = migrate1to2(V1);
  assert.deepEqual(parseStore(await readFile(fileOf(config), "utf8")), expected.store);
  assert.deepEqual(JSON.parse(await readFile(quarantineOf(config), "utf8")), { fromSchemaVersion: 1, records: expected.quarantined });
  assert.deepEqual((await readdir(config.dataDir)).sort(), [DATA_FILE_NAME, QUARANTINE_FILE_NAME].sort()); // no temp file, no copy left
  const opened = await initStore(config);
  assert.equal((await opened.repository.list()).length, 2);
});

test("npm run migrate never overwrites an existing quarantine file: it refuses and leaves both files as they were", async () => {
  const config = await freshConfig();
  const earlier = '{ "fromSchemaVersion": 1, "records": [] }\n';
  await writeFile(quarantineOf(config), earlier);
  await writeFile(fileOf(config), JSON.stringify(V1));
  const refused = migrateIn(config);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /never overwritten/);
  assert.equal(await readFile(quarantineOf(config), "utf8"), earlier);
  assert.equal(await readFile(fileOf(config), "utf8"), JSON.stringify(V1));
  await writeFile(fileOf(config), JSON.stringify(V1_CLEAN)); // nothing to quarantine: the file is not in the way
  assert.equal(migrateIn(config).status, 0);
  assert.equal(await readFile(quarantineOf(config), "utf8"), earlier);
  assert.equal((await createFileRepository(config.dataDir).list()).length, 2);
});

test("a backup verifies by a restore into a scratch folder; a changed byte or a missing manifest fails without throwing", async () => {
  const config = await freshConfig();
  await initStore(config);
  const backupsDir = backupsDirOf(config);
  const { backupPath, manifest } = await backupStore(fileOf(config), backupsDir, "2026-10-04T10-00-00-000Z");
  assert.equal(manifest.count, 6);
  assert.equal(manifest.byCategory, "food:105600,transport:52000,home:9990,fun:48000");
  const scratch = path.join(config.dataDir, "scratch");
  assert.deepEqual(await verifyBackup(backupPath, scratch), { ok: true, count: 6, problems: [] });
  assert.equal(await readFile(fileOf(config), "utf8"), await readFile(backupPath, "utf8")); // the live store is untouched
  await writeFile(backupPath, (await readFile(backupPath, "utf8")).replace('"amountMinor": 84550', '"amountMinor": 84551'));
  const changed = await verifyBackup(backupPath, scratch);
  assert.equal(changed.ok, false);
  assert.ok(changed.problems.some((problem) => problem.startsWith("sha256")));
  const missing = await verifyBackup(path.join(backupsDir, "nothing.json"), scratch);
  assert.equal(missing.ok, false);
});

test("a damaged store is moved aside and the newest VERIFIED backup restored; the report names the lost expenses", async () => {
  const config = await freshConfig();
  const opened = await initStore(config);
  const backupsDir = backupsDirOf(config);
  await backupStore(fileOf(config), backupsDir, "2026-10-04T09-00-00-000Z"); // six expenses
  await opened.repository.save({ id: "e-07", label: "%%fixture1Name%% 2", amountMinor: 3000, date: "2026-03-03", category: "food" });
  await backupStore(fileOf(config), backupsDir, "2026-10-04T10-00-00-000Z"); // seven expenses
  await opened.repository.save({ id: "e-08", label: "%%fixture2Name%% 2", amountMinor: 500, date: "2026-03-03", category: "transport" });
  const newest = await backupStore(fileOf(config), backupsDir, "2026-10-04T11-00-00-000Z"); // eight expenses
  await opened.repository.save({ id: "e-09", label: "%%fixture6Name%% 2", amountMinor: 700, date: "2026-03-03", category: "food" });
  const damaged = (await readFile(fileOf(config), "utf8")).replace('"amountMinor": 84550', '"amountMinor": "84550"');
  await writeFile(fileOf(config), damaged);
  await writeFile(newest.backupPath, (await readFile(newest.backupPath, "utf8")) + " "); // the newest no longer verifies
  const report = await recoverStore(fileOf(config), backupsDir, "2026-10-04T12-00-00-000Z");
  assert.deepEqual(report, {
    action: "restored",
    quarantined: `${DATA_FILE_NAME}.corrupt-2026-10-04T12-00-00-000Z`,
    restoredFrom: "expenses.2026-10-04T10-00-00-000Z.json",
    count: 7,
    notInBackup: ["e-08", "e-09"],
  });
  assert.equal(await readFile(path.join(config.dataDir, report.quarantined), "utf8"), damaged); // moved aside as evidence
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
      fetch(`${base}/v1/records`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label: `%%fixture6Name%% ${index}`, amountMinor: index + 1, date: "2026-03-02", category: "food" }), signal: AbortSignal.timeout(5000) }).then((response) => response.json()),
    ),
  );
  assert.equal(new Set(answers.map((expense) => expense.id)).size, 20);
  assert.equal((await repository.list()).length, 26);
});
