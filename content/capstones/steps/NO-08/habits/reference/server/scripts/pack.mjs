// The artifact: `npm run pack` in server/ builds release/ (scripts/build.mjs) and packs it with npm pack
// into artifacts/<name>-<version>.tgz, next to a release record <artifact>.release.json: what it is, from
// which commit, built on which Node, its size and its SHA-256 — the checksum you compare before starting or
// rolling back to it. An artifact is kept, never rebuilt: the same commit packed on another Node or npm
// gives other bytes. One that exists already is not overwritten — raise the version first.
// `ci` in the record says whether the checks ran before it: "passed" when scripts/ci.mjs made it, "skipped"
// when `npm run pack` was run by hand.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SERVER = path.resolve(import.meta.dirname, "..");
const ARTIFACTS = path.join(SERVER, "artifacts");
const pkg = JSON.parse(await readFile(path.join(SERVER, "package.json"), "utf8"));
const artifact = path.join(ARTIFACTS, `${pkg.name}-${pkg.version}.tgz`);
if (await access(artifact).then(() => true, () => false)) {
  console.error(`✖ ${path.relative(SERVER, artifact)} exists already: an artifact is never rebuilt. Raise the version in package.json first.`);
  process.exit(1);
}

const built = spawnSync(process.execPath, [path.join(SERVER, "scripts", "build.mjs")], { stdio: "inherit" });
if (built.status !== 0) {
  process.exit(1);
}
await mkdir(ARTIFACTS, { recursive: true });
execFileSync("npm", ["pack", "./release", "--pack-destination", "artifacts", "--silent"], { cwd: SERVER, stdio: ["ignore", "ignore", "inherit"] });

const bytes = await readFile(artifact);
let commit = "not a git repository";
try {
  commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: SERVER, encoding: "utf8" }).trim();
} catch {
  // Packed outside Git: the record says so.
}
const record = {
  name: pkg.name,
  version: pkg.version,
  commit: commit,
  node: process.version,
  ci: process.env.CI_PASSED === "1" ? "passed" : "skipped",
  artifact: path.basename(artifact),
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  verify: [`shasum -a 256 ${path.basename(artifact)}`, `sha256sum ${path.basename(artifact)}`],
};
await writeFile(artifact + ".release.json", JSON.stringify(record, null, 2) + "\n");
console.log(`✔ artifacts/${record.artifact} (${record.bytes} bytes, commit ${commit}, ci ${record.ci})\n  sha256 ${record.sha256}`);
