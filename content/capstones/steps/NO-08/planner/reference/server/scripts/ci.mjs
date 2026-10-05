// Local CI of the server: `npm run ci` in server/. The stages run in turn and the first failure stops it
// with no artifact: typecheck (tsc), test (node --test), then the artifact and its release record
// (scripts/pack.mjs). There is no lint stage: the project's ESLint lints the .js files of the web project,
// and the server is .ts checked by tsc. Install the dependencies first (`npm ci` on a fresh clone).
import { spawnSync } from "node:child_process";
import path from "node:path";

const SERVER = path.resolve(import.meta.dirname, "..");
// Node 22.13–22.17 runs .ts files only with this flag; newer Node needs none (process.features.typescript).
const strip = process.features.typescript ? [] : ["--experimental-strip-types"];
// [name, command, args, shell]. The typecheck is one command line for a shell, which finds npx (npx.cmd on
// Windows); a shell gets no separate args, because Node 24 and newer warn about those (DEP0190).
const STAGES = [
  ["typecheck", "npx tsc -p .", [], true],
  ["test", process.execPath, [...strip, "--test", "tests/*.test.ts"], false],
  ["artifact", process.execPath, [path.join("scripts", "pack.mjs")], false],
];

for (const [name, command, args, shell] of STAGES) {
  console.log(`\n▶ ${name}: ${[shell ? command : path.basename(command), ...args].join(" ")}`);
  const result = spawnSync(command, args, { cwd: SERVER, stdio: "inherit", shell: shell, env: { ...process.env, CI_PASSED: "1" } });
  if (result.status !== 0) {
    console.error(`\n✖ CI stopped at "${name}" (exit code ${result.status}). No artifact was produced.`);
    process.exit(1);
  }
}
console.log("\n✔ CI passed.");
