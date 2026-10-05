// Imports expenses from a JSON lines file into the store: `npm run import -- data/import.jsonl` in server/,
// with the server stopped (the write queue protects one process only). The same job as POST /v1/import:
// every line checked, nothing written unless all lines are valid, an upsert by id — so running it again
// with the same file changes nothing. Ctrl+C aborts it, and the store stays as it was.
import { createReadStream } from "node:fs";
import { ID_PATTERN } from "./api.ts";
import { ApiError } from "./api-errors.ts";
import { loadConfig } from "./config.ts";
import { importJsonLines } from "./importer.ts";
import { initStore } from "./open.ts";

async function main(): Promise<number> {
  const config = loadConfig(process.env);
  const sourcePath = process.argv[2];
  if (!config.ok || sourcePath === undefined) {
    console.error(config.ok ? "Usage: npm run import -- <file.jsonl>" : config.errors.join("\n"));
    return 1;
  }
  const controller = new AbortController();
  process.once("SIGINT", () => controller.abort());
  try {
    const { repository } = await initStore(config.value);
    const started = performance.now();
    const result = await importJsonLines(createReadStream(sourcePath), repository, { idPattern: ID_PATTERN, signal: controller.signal });
    console.log(`Imported ${result.lines} lines in ${Math.round(performance.now() - started)} ms: ${result.created} new expenses, ${result.updated} updated; the store holds ${(await repository.list()).length}.`);
    return 0;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Import refused (${error.code}), nothing was written: ${JSON.stringify(error.details)}`);
    } else {
      console.error(`Import failed, nothing was written: ${(error as Error).name}`);
    }
    return 1;
  }
}

process.exitCode = await main();
