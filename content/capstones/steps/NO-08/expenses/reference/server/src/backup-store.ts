// Backs up the stored expenses and verifies the backup by a restore: `npm run backup` in server/. The copy
// and its manifest go to server/data/backups/; the restore goes to a scratch folder next to them and is
// deleted afterwards. Exit code 1 when the backup cannot be made or does not verify.
import path from "node:path";
import { rm } from "node:fs/promises";
import { backupStore, stampOf, verifyBackup } from "./backup.ts";
import { loadConfig } from "./config.ts";
import { DATA_FILE_NAME } from "./fileRepository.ts";
import { resolveInside } from "./files.ts";
import { backupsDirOf } from "./open.ts";

async function main(): Promise<number> {
  const config = loadConfig(process.env);
  if (!config.ok) {
    for (const message of config.errors) {
      console.error(message);
    }
    return 1;
  }
  const stamp = stampOf(new Date());
  const backupsDir = backupsDirOf(config.value);
  let backupPath: string;
  try {
    const made = await backupStore(resolveInside(config.value.dataDir, DATA_FILE_NAME), backupsDir, stamp);
    backupPath = made.backupPath;
    const { count, byCategory, sha256 } = made.manifest;
    console.log(`Backup: backups/${path.basename(backupPath)} — ${count} expenses, by category ${byCategory}, sha256 ${sha256.slice(0, 12)}…`);
  } catch (error) {
    console.error(`Cannot back up: ${(error as Error).message}`);
    return 1;
  }
  const scratch = path.join(backupsDir, `.verify-${stamp}`);
  const verified = await verifyBackup(backupPath, scratch);
  await rm(scratch, { recursive: true, force: true });
  if (!verified.ok) {
    console.error(`The backup does not verify: ${verified.problems.join("; ")}`);
    return 1;
  }
  console.log(`Verified by a restore into a scratch folder: ${verified.count} expenses, the same sha256, ids and per-category totals.`);
  return 0;
}

process.exitCode = await main();
