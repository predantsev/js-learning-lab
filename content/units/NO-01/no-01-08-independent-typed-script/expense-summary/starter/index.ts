// Read-only driver: three "terminal runs" of the summary, each with its own command line and environment.
import { summarize } from "./summary.ts";

const out = { log: (line: string) => console.log(line), error: (line: string) => console.error(line) };
const runs: Array<{ argv: string[]; env: Record<string, string | undefined> }> = [
  { argv: [], env: {} },
  { argv: ["--limit", "2"], env: { LOCALE: "en" } },
  { argv: ["--limit", "two"], env: { DATA_FILE: "missing.json" } },
];

for (const { argv, env } of runs) {
  console.log(`$ ${Object.entries(env).map(([k, v]) => `${k}=${v} `).join("")}node summary.ts ${argv.join(" ")}`);
  const code = await summarize(argv, env, out);
  console.log(`exit code ${code}`);
}
