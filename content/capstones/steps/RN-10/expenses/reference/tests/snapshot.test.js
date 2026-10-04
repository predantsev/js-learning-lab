// Tests of src/snapshot.ts and of the repository over it, with the memory storage: the migration of the
// supplied legacy snapshot, the versions it refuses, and a damaged snapshot set aside under the backup key.
import { readFileSync } from "node:fs";
import { test, expect } from "./testing.js";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";
import { BACKUP_KEY, CURRENT_VERSION, KEY, loadSnapshot, migrate, restoreSnapshot } from "../src/snapshot.ts";

const LEGACY_TEXT = readFileSync(new URL("../data/legacy-v0.json", import.meta.url), "utf8");

test("the supplied legacy v0 snapshot migrates to the current version", () => {
  const restored = restoreSnapshot(LEGACY_TEXT);
  expect(CURRENT_VERSION, "the current version").toBe(1);
  expect(restored, "data/legacy-v0.json").toEqual({ ok: true, records: [{ id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" }, { id: "e-02", label: "%%fixture2Name%%", amountMinor: 52000, date: "2026-03-01", category: "transport" }, { id: "e-04", label: "%%fixture4Name%%", amountMinor: 9990, date: "2026-02-27", category: "home" }], migrated: true });
});

test("migrate never changes the snapshot it receives", () => {
  const saved = JSON.parse(LEGACY_TEXT);
  const before = JSON.stringify(saved);
  migrate(saved);
  expect(JSON.stringify(saved), "the received snapshot").toBe(before);
});

test("a newer version, an unknown shape, broken JSON and a broken v0 record are refused with their reason", () => {
  expect(migrate({ schemaVersion: 2, records: [] }), "version 2").toEqual({ ok: false, reason: "newer" });
  expect(migrate({ records: [] }), "no version").toEqual({ ok: false, reason: "invalid" });
  expect(migrate({ schemaVersion: -1, records: [] }), "version -1").toEqual({ ok: false, reason: "invalid" });
  expect(restoreSnapshot('{"schemaVersion":1,"records":['), "cut-off text").toEqual({ ok: false, reason: "unparsable" });
  expect(restoreSnapshot(JSON.stringify({ schemaVersion: 0, records: [{ id: "e-01", label: "%%fixture1Name%%", amount: 0.1 + 0.2, date: "2026-03-01", category: "food" }] })), "a v0 record the contract refuses").toEqual({ ok: false, reason: "invalid-record" });
});

test("loadSnapshot saves a migrated snapshot again in the current version", async () => {
  const storage = createMemoryStorage();
  await storage.setItem(KEY, LEGACY_TEXT);
  const loaded = await loadSnapshot(storage);
  expect(loaded.status, "status").toBe("restored");
  expect(JSON.parse(await storage.getItem(KEY)).schemaVersion, "the saved version").toBe(CURRENT_VERSION);
});

test("a damaged snapshot goes under the backup key unchanged, the starting list replaces it, and the notice comes once", async () => {
  const storage = createMemoryStorage();
  const damaged = '{"schemaVersion":1,"records":[{"id"';
  await storage.setItem(KEY, damaged);
  const repository = createRepository(storage, [{ id: "e-03", label: "%%fixture3Name%%", amountMinor: 18000, date: "2026-02-28", category: "fun" }]);
  const first = await repository.readAll();
  expect(first.recovered, "first read").toBe(true);
  expect(first.records.length, "the starting list").toBe(1);
  expect(await storage.getItem(BACKUP_KEY), "the backup").toBe(damaged);
  expect((await repository.readAll()).recovered, "second read").toBe(false);
});

test("a current snapshot survives a new repository, as after a restart", async () => {
  const storage = createMemoryStorage();
  await storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: [{ id: "e-05", label: "%%fixture5Name%%", amountMinor: 30000, date: "2026-02-27", category: "fun" }] }));
  const read = await createRepository(storage, [{ id: "e-03", label: "%%fixture3Name%%", amountMinor: 18000, date: "2026-02-28", category: "fun" }]).readAll();
  expect(read, "after a restart").toEqual({ records: [{ id: "e-05", label: "%%fixture5Name%%", amountMinor: 30000, date: "2026-02-27", category: "fun" }], recovered: false });
  expect(await storage.getItem(BACKUP_KEY), "no backup").toBe(null);
});
