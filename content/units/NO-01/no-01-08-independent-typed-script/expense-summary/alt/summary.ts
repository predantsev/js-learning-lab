// Another valid solution: events.once() waits for 'end' and rejects on 'error' by itself;
// the record listener is removed in finally, so both outcomes clean up.
import { once } from "node:events";
import { openExpenses } from "./expenses-source.js";
import { formatLine, formatTotal } from "./money.js";

export type Env = Record<string, string | undefined>;
export type Output = { log(line: string): void; error(line: string): void };

export interface Config {
  limit: number;
  locale: "uk" | "en";
  dataFile: string;
}

const LOCALES = ["uk", "en"] as const;

function readLimit(argv: string[]): number | string {
  const at = argv.indexOf("--limit");
  if (at === -1) return 3;
  const text = argv[at + 1] ?? "";
  const value = Number(text);
  return Number.isInteger(value) && value >= 1 && value <= 10 && /^\d+$/.test(text) ? value : `invalid --limit "${text}" (1–10)`;
}

export async function summarize(argv: string[], env: Env, out: Output): Promise<number> {
  const limit = readLimit(argv);
  const locale = env.LOCALE ?? "uk";
  const problems: string[] = [];
  if (typeof limit === "string") problems.push(limit);
  if (!(LOCALES as readonly string[]).includes(locale)) problems.push(`invalid LOCALE "${locale}"`);
  if (problems.length > 0 || typeof limit === "string") {
    problems.forEach((problem) => out.error(problem));
    return 1;
  }
  const config: Config = { limit, locale: locale as Config["locale"], dataFile: env.DATA_FILE ?? "expenses.json" };

  const source = openExpenses(config.dataFile);
  const totals: Record<string, number> = {};
  const onRecord = (expense: { category: string; amountMinor: number }) => {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amountMinor;
  };
  source.on("record", onRecord);
  try {
    await once(source, "end");
  } catch (error) {
    out.error(`${config.dataFile}: ${(error as Error).message}`);
    return 1;
  } finally {
    source.removeListener("record", onRecord);
  }

  const rows = Object.entries(totals).sort(([, a], [, b]) => b - a);
  rows.slice(0, config.limit).forEach(([category, amount]) => out.log(formatLine(category, amount, config.locale)));
  out.log(formatTotal(rows.reduce((sum, [, amount]) => sum + amount, 0), config.locale));
  return 0;
}
