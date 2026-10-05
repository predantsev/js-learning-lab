// Exports the stored habits as JSON lines to a file: `npm run export -- data/export.jsonl` in server/. The
// file appears only complete (a temp file renamed after success); Ctrl+C aborts the export and leaves no
// temp file behind.
import { exportToFile } from "./jsonl.ts";
import { loadConfig } from "./config.ts";
import { initStore } from "./open.ts";

async function main(): Promise<number> {
  const config = loadConfig(process.env);
  const destPath = process.argv[2];
  if (!config.ok || destPath === undefined) {
    console.error(config.ok ? "Usage: npm run export -- <file.jsonl>" : config.errors.join("\n"));
    return 1;
  }
  const controller = new AbortController();
  process.once("SIGINT", () => controller.abort());
  try {
    const { repository } = await initStore(config.value);
    const habits = await repository.list();
    await exportToFile(habits, destPath, controller.signal);
    console.log(`Exported ${habits.length} habits to ${destPath}`);
    return 0;
  } catch (error) {
    console.error(`Export failed: ${(error as Error).name}: ${(error as Error).message}`);
    return 1;
  }
}

process.exitCode = await main();
