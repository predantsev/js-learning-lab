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
  expect(restored, "data/legacy-v0.json").toEqual({ ok: true, records: [{ id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-27", "2026-02-28", "2026-03-01"] }, { id: "h-04", name: "%%fixture4Name%%", frequency: "weekly", active: true, completions: ["2026-02-22", "2026-03-01"] }, { id: "h-06", name: "%%fixture6Name%%", frequency: "daily", active: true, completions: [] }], migrated: true });
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
  expect(restoreSnapshot(JSON.stringify({ schemaVersion: 0, records: [{ id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["1.03.2026"] }] })), "a v0 record the contract refuses").toEqual({ ok: false, reason: "invalid-record" });
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
  const repository = createRepository(storage, [{ id: "h-02", name: "%%fixture2Name%%", frequency: "daily", active: true, completions: [] }]);
  const first = await repository.readAll();
  expect(first.recovered, "first read").toBe(true);
  expect(first.records.length, "the starting list").toBe(1);
  expect(await storage.getItem(BACKUP_KEY), "the backup").toBe(damaged);
  expect((await repository.readAll()).recovered, "second read").toBe(false);
});

test("a current snapshot survives a new repository, as after a restart", async () => {
  const storage = createMemoryStorage();
  await storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: [{ id: "h-03", name: "%%fixture3Name%%", frequency: "daily", active: true, completions: ["2026-03-01"] }] }));
  const read = await createRepository(storage, [{ id: "h-02", name: "%%fixture2Name%%", frequency: "daily", active: true, completions: [] }]).readAll();
  expect(read, "after a restart").toEqual({ records: [{ id: "h-03", name: "%%fixture3Name%%", frequency: "daily", active: true, completions: ["2026-03-01"] }], recovered: false });
  expect(await storage.getItem(BACKUP_KEY), "no backup").toBe(null);
});
