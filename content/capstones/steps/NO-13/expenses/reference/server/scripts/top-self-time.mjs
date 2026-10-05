// `npm run profile:top -- profiles/CPU.….cpuprofile` prints the five functions with the most self time of a
// CPU profile that `node --cpu-prof --cpu-prof-dir=profiles …` wrote when the process exited. Self time is
// the time a function ran itself, not in what it called; "(idle)" (nothing to do) is left out.
import { readFile } from "node:fs/promises";

const file = process.argv[2];
if (file === undefined) {
  console.error("Usage: npm run profile:top -- <file.cpuprofile>");
  process.exit(1);
}
const profile = JSON.parse(await readFile(file, "utf8"));
const byId = new Map(profile.nodes.map((node) => [node.id, node]));
const totals = new Map();
profile.samples.forEach((id, index) => {
  const { functionName, url, lineNumber } = byId.get(id).callFrame;
  const key = `${functionName || "(anonymous)"} ${url.split("/").slice(-2).join("/")}:${lineNumber + 1}`;
  totals.set(key, (totals.get(key) ?? 0) + (profile.timeDeltas[index] ?? 0) / 1000);
});
for (const [key, ms] of [...totals].filter(([key]) => !key.startsWith("(idle)")).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
  console.log(`${ms.toFixed(1).padStart(8)} ms  ${key}`);
}
