// Backups of the task store, verified by a restore, and the recovery of a damaged store on start.
// A backup is a copy of the last complete file (every write goes through writeAtomic, so one read gets
// a whole version) plus a manifest made from the same text: the count, the ids, the pending tasks due
// on or before a fixed day (the day is stored in the manifest too) and the SHA-256. A backup counts only after verifyBackup restored it into a scratch folder — never over the
// live store — and compared it with its manifest. Backups live in <dataDir>/backups/.
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { parseStore } from "./contract.ts";
import { DATA_FILE_NAME, MAX_DATA_BYTES } from "./fileRepository.ts";
import { readTextBounded, resolveInside, writeAtomic } from "./files.ts";
import { storeFacts } from "./migrate.ts";
import type { Facts } from "./migrate.ts";

// `day` is the day the pending-due count was made for; a check recomputes it for that day, never for today.
export type Manifest = Facts & { day: string; sha256: string };

const sha256Of = (text: string) => createHash("sha256").update(text).digest("hex");
const BASE_NAME = DATA_FILE_NAME.replace(/\.json$/, "");
const BACKUP_NAME = new RegExp(`^${BASE_NAME}\\.\\d{4}-.+\\.json$`);

// A time stamp that sorts as text and is safe in a file name: 2026-10-04T18-30-05-123Z.
export function stampOf(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

// Copies the store to <backupsDir>/planner.<stamp>.json and writes its manifest next to it. A damaged
// store is refused: a backup must keep a state worth restoring.
export async function backupStore(file: string, backupsDir: string, stamp: string, day: string): Promise<{ backupPath: string; manifest: Manifest }> {
  const text = await readTextBounded(file, MAX_DATA_BYTES); // one read: the manifest describes exactly this text
  if (text === null) {
    throw new Error(`${path.basename(file)} does not exist: nothing to back up`);
  }
  const manifest: Manifest = { ...storeFacts(parseStore(text), day), day: day, sha256: sha256Of(text) };
  await mkdir(backupsDir, { recursive: true });
  const backupPath = resolveInside(backupsDir, `${BASE_NAME}.${stamp}.json`);
  await writeAtomic(backupPath, text);
  await writeAtomic(`${backupPath}.manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
  return { backupPath: backupPath, manifest: manifest };
}

export type Verified = { ok: boolean; count: number | null; problems: string[] };

// Restores the backup into scratchDir and compares the copy with the manifest: SHA-256, the contract,
// the count, the ids and the pending-due count for the manifest's day. Never throws: every failure is a problem in the answer.
export async function verifyBackup(backupPath: string, scratchDir: string): Promise<Verified> {
  const problems: string[] = [];
  let manifest: Manifest | null = null;
  try {
    manifest = JSON.parse(await readFile(`${backupPath}.manifest.json`, "utf8")) as Manifest;
  } catch (error) {
    problems.push(`manifest: ${(error as Error).message}`);
  }
  const restored = path.join(scratchDir, "restored.json");
  let text: string | null = null;
  try {
    await mkdir(scratchDir, { recursive: true });
    await copyFile(backupPath, restored);
    text = await readFile(restored, "utf8");
  } catch (error) {
    problems.push(`restore: ${(error as Error).message}`);
  } finally {
    await rm(restored, { force: true });
  }
  let count: number | null = null;
  if (text !== null) {
    if (manifest !== null && sha256Of(text) !== manifest.sha256) {
      problems.push("sha256: the copy differs from the manifest");
    }
    try {
      const store = parseStore(text);
      count = store.records.length;
      if (manifest !== null) {
        const restoredFacts = storeFacts(store, manifest.day);
        for (const key of ["count", "ids", "pendingDue"] as const) {
          if (restoredFacts[key] !== manifest[key]) {
            problems.push(`${key}: manifest ${manifest[key]}, restored ${restoredFacts[key]}`);
          }
        }
      }
    } catch (error) {
      problems.push(`contract: ${(error as Error).message}`);
    }
  }
  return { ok: problems.length === 0, count: count, problems: problems };
}

export type Recovery =
  | { action: "missing" }
  | { action: "ok"; count: number }
  | { action: "restored"; quarantined: string; restoredFrom: string; count: number; notInBackup: string[] | null };

// The ids of the damaged text that the backup does not have, or null when the damaged text is not JSON.
function lostIds(damagedText: string, backupText: string): string[] | null {
  let damaged: unknown;
  try {
    damaged = JSON.parse(damagedText);
  } catch {
    return null;
  }
  const records = (damaged as { records?: unknown })?.records;
  if (!Array.isArray(records)) {
    return null;
  }
  const kept = new Set(parseStore(backupText).records.map((task) => task.id));
  return records.map((record) => String((record as { id?: unknown })?.id)).filter((id) => !kept.has(id)).sort();
}

// On start: a missing store is the first start; a store that passes the contract is fine; a damaged one
// is replaced by the newest VERIFIED backup. The backup is found before anything is touched: without one
// the server refuses to start and leaves the file where it is. The damaged file is renamed aside
// (planner.json.corrupt-<stamp>), never deleted. No branch leads to an empty store.
export async function recoverStore(file: string, backupsDir: string, stamp: string): Promise<Recovery> {
  const damagedText = await readTextBounded(file, MAX_DATA_BYTES).catch((error: Error) => `unreadable: ${error.message}`);
  if (damagedText === null) {
    return { action: "missing" };
  }
  try {
    return { action: "ok", count: parseStore(damagedText).records.length };
  } catch {
    // damaged: look for a backup below
  }
  let names: string[] = [];
  try {
    names = await readdir(backupsDir);
  } catch {
    names = []; // no backups folder: no backups
  }
  const candidates = names.filter((name) => BACKUP_NAME.test(name)).sort().reverse(); // the newest first
  const scratch = path.join(backupsDir, `.verify-${stamp}`);
  let chosen: string | null = null;
  for (const name of candidates) {
    if ((await verifyBackup(path.join(backupsDir, name), scratch)).ok) {
      chosen = path.join(backupsDir, name);
      break;
    }
  }
  await rm(scratch, { recursive: true, force: true });
  if (chosen === null) {
    throw new Error(`${path.basename(file)} is damaged and there is no verified backup in ${backupsDir}: refusing to start`);
  }
  const quarantined = `${file}.corrupt-${stamp}`;
  await rename(file, quarantined);
  const backupText = await readFile(chosen, "utf8");
  await writeAtomic(file, backupText);
  return {
    action: "restored",
    quarantined: path.basename(quarantined),
    restoredFrom: path.basename(chosen),
    count: parseStore(backupText).records.length,
    notInBackup: lostIds(damagedText, backupText),
  };
}
