// Prints the titles of the first planner tasks; `--limit N` says how many (default 3).
// `argv` is what follows the file name on the command line, `env` the environment variables.
import { tasks } from './tasks.js';

export function runSummary(argv, env) {
  const flag = argv.indexOf('--limit');
  const limitText = flag === -1 ? '3' : argv[flag + 1];
  const limit = Number(limitText);
  if (!Number.isInteger(limit) || limit < 1) {
    console.error(`%%badLimit%% "${limitText}"`);
    process.exit(1);
  }
  const locale = env.LOCALE ?? 'uk';
  const titles = tasks.slice(0, limit).map((task) => task.title[locale]);
  console.log(`[${locale}] ${titles.join(' · ')}`);
}
