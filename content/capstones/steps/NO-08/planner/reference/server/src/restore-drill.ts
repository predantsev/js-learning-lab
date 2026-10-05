// The restore drill: `npm run restore-drill -- <new folder>` in server/ (DATA_DIR is the live data folder, as
// for the server). It takes the newest backup of <DATA_DIR>/backups/ that verifies, restores it into a new,
// empty folder — never over the live store — and asks the live store and the restored one the same
// questions: how many tasks, which ids, how many are pending, and how many pending tasks are due on or
// before the FIXED day of TODAY (required: the computer's today would change the answer from day to day).
// Sizes are never compared. Exit code 0 when the answers match; 1 when they differ, there is no verified
// backup, the folder is not new or TODAY is missing. Then start the server on the restored folder
// (DATA_DIR=<new folder> PORT=4312) and compare `npm run check:deploy -- <url> <the same day>` of both.
// The comparison is exact only when nothing was written between the backup and the drill.
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { BACKUP_NAME, verifyBackup } from "./backup.ts";
import { loadConfig, requireToday } from "./config.ts";
import { parseStore } from "./contract.ts";
import type { Store } from "./contract.ts";
import { DATA_FILE_NAME } from "./fileRepository.ts";
import { resolveInside } from "./files.ts";
import { storeFacts } from "./migrate.ts";
import type { Facts } from "./migrate.ts";
import { backupsDirOf } from "./open.ts";

// The facts of src/migrate.ts for the day, and the pending count the web app shows next to them.
type DrillFacts = Facts & { pending: number };

function drillFacts(store: Store, day: string): DrillFacts {
  return { ...storeFacts(store, day), pending: store.records.filter((task) => !task.done).length };
}

// The ids are compared in full but printed as a short fingerprint: thousands of ids are not readable.
const line = (facts: DrillFacts, day: string) => `${facts.count} tasks, pending ${facts.pending}, due on or before ${day} ${facts.pendingDue}, ids ${createHash("sha256").update(facts.ids).digest("hex").slice(0, 12)}`;

async function main(): Promise<number> {
  const config = loadConfig(process.env);
  const target = process.argv[2];
  if (!config.ok || target === undefined) {
    console.error(config.ok ? "Usage: TODAY=YYYY-MM-DD npm run restore-drill -- <a new, empty folder>" : config.errors.join("\n"));
    return 1;
  }
  const day = requireToday(config.value);
  if (day === null) {
    return 1;
  }
  const folder = path.resolve(target);
  if (folder === config.value.dataDir) {
    console.error("The drill never restores over the live data folder: give it a new folder.");
    return 1;
  }
  const existing = await readdir(folder).catch(() => [] as string[]);
  if (existing.length > 0) {
    console.error(`${folder} is not empty: a drill restores into a new, empty folder.`);
    return 1;
  }
  const backupsDir = backupsDirOf(config.value);
  const names = (await readdir(backupsDir).catch(() => [] as string[])).filter((name) => BACKUP_NAME.test(name)).sort().reverse();
  let chosen: string | null = null;
  const scratch = path.join(folder, ".verify");
  for (const name of names) {
    if ((await verifyBackup(path.join(backupsDir, name), scratch)).ok) {
      chosen = name;
      break;
    }
  }
  await rm(scratch, { recursive: true, force: true });
  if (chosen === null) {
    console.error(`No verified backup in ${backupsDir}: run "npm run backup" first.`);
    return 1;
  }
  await mkdir(folder, { recursive: true });
  const restoredFile = resolveInside(folder, DATA_FILE_NAME);
  await copyFile(path.join(backupsDir, chosen), restoredFile);
  const live = drillFacts(parseStore(await readFile(resolveInside(config.value.dataDir, DATA_FILE_NAME), "utf8")), day);
  const restored = drillFacts(parseStore(await readFile(restoredFile, "utf8")), day);
  console.log(`Restored backups/${chosen} into ${folder}`);
  console.log(`live:     ${line(live, day)}`);
  console.log(`restored: ${line(restored, day)}`);
  const same = live.count === restored.count && live.ids === restored.ids && live.pending === restored.pending && live.pendingDue === restored.pendingDue;
  console.log(same ? "✔ the restored store answers the same as the live one" : "✖ the restored store answers differently: was something written after the backup?");
  return same ? 0 : 1;
}

process.exitCode = await main();
