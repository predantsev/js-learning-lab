// The restore drill: `npm run restore-drill -- <new folder>` in server/ (DATA_DIR is the live data folder, as
// for the server). It takes the newest backup of <DATA_DIR>/backups/ that verifies, restores it into a new,
// empty folder — never over the live store — and asks the live store and the restored one the same
// questions: how many expenses, which ids, the overall total and the total of each category in amountMinor
// (to the minor unit). Sizes are never compared. Exit code 0 when the answers match; 1 when they differ,
// there is no verified backup or the folder is not new. Then start the server on the restored folder
// (DATA_DIR=<new folder> PORT=4312) and compare `npm run check:deploy` of both.
// The comparison is exact only when nothing was written between the backup and the drill.
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { summarizeExpenses } from "../../domain/expenses.ts";
import { BACKUP_NAME, verifyBackup } from "./backup.ts";
import { loadConfig } from "./config.ts";
import { parseStore } from "./contract.ts";
import type { Store } from "./contract.ts";
import { DATA_FILE_NAME } from "./fileRepository.ts";
import { resolveInside } from "./files.ts";
import { storeFacts } from "./migrate.ts";
import type { Facts } from "./migrate.ts";
import { backupsDirOf } from "./open.ts";

// The facts of src/migrate.ts (count, ids, per-category totals) and the overall total the summary screen shows.
type Answers = Facts & { total: number };
const answersOf = (store: Store): Answers => ({ ...storeFacts(store), total: summarizeExpenses(store.records).total });

// The ids are compared in full but printed as a short fingerprint: thousands of ids are not readable.
const line = (answers: Answers) => `${answers.count} expenses, total ${answers.total}, ${answers.byCategory} (amountMinor), ids ${createHash("sha256").update(answers.ids).digest("hex").slice(0, 12)}`;

async function main(): Promise<number> {
  const config = loadConfig(process.env);
  const target = process.argv[2];
  if (!config.ok || target === undefined) {
    console.error(config.ok ? "Usage: npm run restore-drill -- <a new, empty folder>" : config.errors.join("\n"));
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
  const live = answersOf(parseStore(await readFile(resolveInside(config.value.dataDir, DATA_FILE_NAME), "utf8")));
  const restored = answersOf(parseStore(await readFile(restoredFile, "utf8")));
  console.log(`Restored backups/${chosen} into ${folder}`);
  console.log(`live:     ${line(live)}`);
  console.log(`restored: ${line(restored)}`);
  const same = live.count === restored.count && live.ids === restored.ids && live.total === restored.total && live.byCategory === restored.byCategory;
  console.log(same ? "✔ the restored store answers the same as the live one" : "✖ the restored store answers differently: was something written after the backup?");
  return same ? 0 : 1;
}

process.exitCode = await main();
