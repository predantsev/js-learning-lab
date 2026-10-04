// The expense summary script. Write loadConfig and summarize as the task describes.
import { openExpenses } from "./expenses-source.js";
import { formatLine, formatTotal } from "./money.js";

export type Env = Record<string, string | undefined>;
export type Output = { log(line: string): void; error(line: string): void };

export interface Config {
  limit: number;
  locale: "uk" | "en";
  dataFile: string;
}

export async function summarize(argv: string[], env: Env, out: Output): Promise<number> {
  out.error("not written yet");
  return 1;
}
