// Opens the repository the way every script (and later the server) starts: remove the temp files a
// crash left, then — on the very first start — fill the data file with the web project's starting
// records. With CRASH_BEFORE_RENAME=1 every save stops the process between the temp-file write and the
// rename (SIGKILL, as a crash would): a rehearsal, never for real use.
import type { Config } from "./config.ts";
import { createFileRepository } from "./fileRepository.ts";
import type { TaskRepository } from "./fileRepository.ts";
import { loadFixtures } from "./fixtures.ts";

export type Opened = { repository: TaskRepository; removedTemps: string[]; seeded: boolean };

export async function openRepository(config: Config): Promise<Opened> {
  const beforeRename = config.crashBeforeRename ? () => process.kill(process.pid, "SIGKILL") : undefined;
  const repository = createFileRepository(config.dataDir, { beforeRename: beforeRename });
  const removedTemps = await repository.recover();
  const seeded = await repository.seed(await loadFixtures());
  return { repository: repository, removedTemps: removedTemps, seeded: seeded };
}
