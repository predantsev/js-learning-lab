// Opens the store the way every script and the server start — always before the server listens:
//   1. delete the temp files a crash left behind;
//   2. refuse a store this program must not touch: version 1 waits for `npm run migrate`, a version
//      newer than 2 belongs to newer code;
//   3. check the store against the contract; a damaged one is replaced by the newest verified backup
//      from <dataDir>/backups/ (recoverStore), or the start is refused;
//   4. seed the web project's starting wishes only into a missing or empty store.
// Starting twice gives the same result as starting once. With CRASH_BEFORE_RENAME=1 every save stops the
// process between the temp-file write and the rename (SIGKILL, as a crash would): a rehearsal only.
import path from "node:path";
import type { Config } from "./config.ts";
import { STORE_VERSION } from "./contract.ts";
import { recoverStore, stampOf } from "./backup.ts";
import type { Recovery } from "./backup.ts";
import { createFileRepository, MAX_DATA_BYTES } from "./fileRepository.ts";
import type { WishRepository } from "./fileRepository.ts";
import { readTextBounded } from "./files.ts";
import { loadFixtures } from "./fixtures.ts";

export type Opened = { repository: WishRepository; removedTemps: string[]; recovery: Recovery; seeded: boolean };

export const backupsDirOf = (config: Config) => path.join(config.dataDir, "backups");

// The schemaVersion written in the file, or undefined when the text is not a JSON object.
function versionOf(text: string): unknown {
  try {
    return (JSON.parse(text) as { schemaVersion?: unknown })?.schemaVersion;
  } catch {
    return undefined;
  }
}

export async function initStore(config: Config): Promise<Opened> {
  const beforeRename = config.crashBeforeRename ? () => process.kill(process.pid, "SIGKILL") : undefined;
  const repository = createFileRepository(config.dataDir, { beforeRename: beforeRename });
  const removedTemps = await repository.recover();
  const text = await readTextBounded(repository.file, MAX_DATA_BYTES).catch(() => null);
  if (text !== null) {
    const version = versionOf(text);
    if (version === 1) {
      throw new Error(`${path.basename(repository.file)} is schemaVersion 1: run "npm run migrate" first`);
    }
    if (typeof version === "number" && version > STORE_VERSION) {
      throw new Error(`${path.basename(repository.file)} is schemaVersion ${version}, newer than this program knows (${STORE_VERSION}): refusing to start`);
    }
  }
  const recovery = await recoverStore(repository.file, backupsDirOf(config), stampOf(new Date()));
  const seeded = await repository.seed(await loadFixtures());
  return { repository: repository, removedTemps: removedTemps, recovery: recovery, seeded: seeded };
}
