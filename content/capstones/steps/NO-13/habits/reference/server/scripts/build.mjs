// The production build: `npm run build` in server/ writes release/ — the server as plain JavaScript that
// starts with `node server/src/server.js`, with no type stripping and no dev dependencies. Every .ts file
// of src/ and every file outside server/ that it imports (the domain, the web project's data model and
// starting records) is copied with the project's layout, so the relative imports stay true; a .ts file
// goes through stripTypeScriptTypes (node:module: the types become spaces, so lines and columns match the
// source) and its imports of "./x.ts" become "./x.js". The types are checked before, by tsc (npm run
// typecheck), not here. release/package.json carries the name and the version: `npm pack ./release` (see
// scripts/pack.mjs) makes the artifact of it.
import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile, readdir } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";

const SERVER = path.resolve(import.meta.dirname, "..");
const PROJECT = path.dirname(SERVER);
// `node scripts/build.mjs <folder>` builds into another folder (the tests do); release/ by default.
const OUT = path.resolve(process.argv[2] ?? path.join(SERVER, "release"));
const IMPORT = /(?:from|import)\s*\(?\s*"(\.{1,2}\/[^"]+)"/g;
// Read by path at run time, not imported, so the import walk cannot find it: the starting records that
// src/fixtures.ts seeds an empty store with.
const RUN_TIME_FILES = ["data/habits.json"];
// Checks that start src/*.ts files themselves: they belong to the source tree, not to a release.
const DEV_ONLY = ["check-repository.ts", "check-server.ts"];

const pkg = JSON.parse(await readFile(path.join(SERVER, "package.json"), "utf8"));
await rm(OUT, { recursive: true, force: true });

const sources = (await readdir(path.join(SERVER, "src"))).filter((name) => name.endsWith(".ts") && !DEV_ONLY.includes(name));
const queue = [...sources.map((name) => path.join(SERVER, "src", name)), ...RUN_TIME_FILES.map((name) => path.join(PROJECT, name))];
const done = new Set();
while (queue.length > 0) {
  const file = queue.shift();
  if (done.has(file)) {
    continue;
  }
  done.add(file);
  const relative = path.relative(PROJECT, file);
  if (relative.startsWith("..")) {
    throw new Error(`${file} is outside the project: a release carries only the project's files`);
  }
  let text = await readFile(file, "utf8");
  for (const [, specifier] of text.matchAll(IMPORT)) {
    queue.push(path.resolve(path.dirname(file), specifier));
  }
  let target = path.join(OUT, relative);
  if (file.endsWith(".ts")) {
    text = stripTypeScriptTypes(text).replace(/("\.{1,2}\/[^"]+)\.ts"/g, '$1.js"');
    target = target.slice(0, -3) + ".js";
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, text);
}

// The page renders with react-dom/server from the web project's node_modules, so the release carries those
// packages (and react-dom's dependency scheduler) in its own node_modules and lists them as bundled: npm pack
// puts them into the artifact, and the artifact starts with no npm install. The client entry goes in as the
// production build (minified; React's production build gives error codes instead of messages).
const RUNTIME_PACKAGES = ["react", "react-dom", "scheduler"];
const dependencies = {};
for (const name of RUNTIME_PACKAGES) {
  await cp(path.join(PROJECT, "node_modules", name), path.join(OUT, "node_modules", name), { recursive: true });
  dependencies[name] = JSON.parse(await readFile(path.join(PROJECT, "node_modules", name, "package.json"), "utf8")).version;
}
const client = spawnSync(process.execPath, [path.join(SERVER, "scripts", "build-client.mjs"), "--minify", path.join(OUT, "server", "public", "client.js")], { stdio: "inherit" });
if (client.status !== 0) {
  process.exit(1);
}

// Two package.json files with the same name and version: the release's own (what npm pack reads) and the
// server's (what server.js reads for its start line). "type": "module" makes Node read the .js files as
// ES modules.
const manifest = { name: pkg.name, version: pkg.version, private: true, type: "module", engines: pkg.engines };
await writeFile(path.join(OUT, "package.json"), JSON.stringify({ ...manifest, main: "server/src/server.js", dependencies: dependencies, bundleDependencies: RUNTIME_PACKAGES }, null, 2) + "\n");
await writeFile(path.join(OUT, "server", "package.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`${path.relative(SERVER, OUT)}/: ${pkg.name} ${pkg.version}, ${done.size} files and ${RUNTIME_PACKAGES.map((name) => `${name} ${dependencies[name]}`).join(", ")} (${[...done].filter((file) => !file.startsWith(SERVER)).map((file) => path.relative(PROJECT, file)).join(", ")} from the web project)`);
