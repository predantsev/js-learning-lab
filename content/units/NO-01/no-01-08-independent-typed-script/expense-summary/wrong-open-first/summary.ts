// Misconception: reading the file early saves time. The file is opened before the config
// is checked, so an invalid config still touches the disk (not fail fast).
import { openExpenses } from "./expenses-source.js";
import { formatLine, formatTotal } from "./money.js";

export type Env = Record<string, string | undefined>;
export type Output = { log(line: string): void; error(line: string): void };

export interface Config {
  limit: number;
  locale: "uk" | "en";
  dataFile: string;
}

type Expense = { amountMinor: number; category: string };

export function loadConfig(argv: string[], env: Env): { ok: true; value: Config } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  const flag = argv.indexOf("--limit");
  const limitText = flag === -1 ? "3" : argv[flag + 1] ?? "";
  const limit = Number(limitText);
  if (!/^\d+$/.test(limitText) || limit < 1 || limit > 10) errors.push(`--limit must be a whole number from 1 to 10, got "${limitText}"`);

  const locale = env.LOCALE ?? "uk";
  if (locale !== "uk" && locale !== "en") errors.push(`LOCALE must be uk or en, got "${locale}"`);

  const dataFile = env.DATA_FILE ?? "expenses.json";

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { limit, locale: locale as Config["locale"], dataFile } };
}

function totalsOf(file: string): Promise<Map<string, number>> {
  return new Promise((resolve, reject) => {
    const source = openExpenses(file);
    const totals = new Map<string, number>();
    const onRecord = (expense: Expense) => totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amountMinor);
    const onEnd = () => {
      cleanup();
      resolve(totals);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    function cleanup() {
      source.off("record", onRecord);
      source.off("end", onEnd);
      source.off("error", onError);
    }
    source.on("record", onRecord);
    source.on("end", onEnd);
    source.on("error", onError);
  });
}

export async function summarize(argv: string[], env: Env, out: Output): Promise<number> {
  const early = totalsOf(env.DATA_FILE ?? "expenses.json");
  const config = loadConfig(argv, env);
  if (!config.ok) {
    for (const message of config.errors) out.error(message);
    return 1;
  }
  const { limit, locale, dataFile } = config.value;

  let totals: Map<string, number>;
  try {
    totals = await early;
  } catch (error) {
    out.error(`cannot read ${dataFile}: ${(error as Error).message}`);
    return 1;
  }

  const ranked = [...totals].sort((a, b) => b[1] - a[1]);
  for (const [category, amount] of ranked.slice(0, limit)) out.log(formatLine(category, amount, locale));
  out.log(formatTotal(ranked.reduce((sum, [, amount]) => sum + amount, 0), locale));
  return 0;
}
