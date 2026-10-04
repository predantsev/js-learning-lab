// The release build: `npm run release` builds the app for production into releases/<version>/, the
// version taken from package.json. The folder is a complete static site: index.html, styles.css,
// images/, the starting data/ and dist/ with file names that carry a hash of their content (app-3F2K….js), so a browser
// may keep them forever while index.html is always asked for again (see scripts/preview.mjs).
// A folder that exists is never overwritten: a release is immutable, and rolling back means serving
// the previous folder. `node scripts/release.mjs ci` (the last stage of `npm run ci`) builds the same
// way into releases/ci/, which is replaced on every run. The development build (dist/) is not touched.
import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";

const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
const ci = process.argv[2] === "ci";
const out = path.join("releases", ci ? "ci" : pkg.version);

if (ci) {
  await fs.rm(out, { recursive: true, force: true });
} else if (await fs.stat(out).catch(() => null)) {
  console.error(`${out} exists already: a release is never rebuilt. Raise the version in package.json first.`);
  process.exit(1);
}

const result = await build({
  entryPoints: ["main.tsx"],
  bundle: true,
  splitting: true,
  format: "esm",
  minify: true, // also makes esbuild define process.env.NODE_ENV as "production": React's production build
  sourcemap: true,
  outdir: path.join(out, "dist"),
  entryNames: "app-[hash]",
  chunkNames: "[name]-[hash]",
  // The version, and the client configuration of .env (data/config.js) as in the development build.
  define: { APP_VERSION: JSON.stringify(pkg.version), CLIENT_ENV: JSON.stringify({ DATA_SOURCE: process.env.DATA_SOURCE, API_BASE_URL: process.env.API_BASE_URL }) },
  metafile: true,
  logLevel: "warning",
});

// The name of the entry file, from esbuild's metafile, goes into the copy of index.html.
const entry = Object.entries(result.metafile.outputs).find(([, output]) => output.entryPoint === "main.tsx")[0];
const html = await fs.readFile("index.html", "utf8");
const script = '<script type="module" src="dist/app.js"></script>';
if (!html.includes(script)) {
  console.error("index.html has no " + script);
  process.exit(1);
}
await fs.writeFile(path.join(out, "index.html"), html.replace(script, `<script type="module" src="dist/${path.basename(entry)}"></script>`));
await fs.cp("styles.css", path.join(out, "styles.css"));
await fs.cp("images", path.join(out, "images"), { recursive: true });
// The starting records are fetched at run time from data/*.json (data/fixtures.js), so they belong to
// the site too; the export's data/exported-storage.json does not.
await fs.mkdir(path.join(out, "data"));
for (const name of await fs.readdir("data")) {
  if (name.endsWith(".json") && name !== "exported-storage.json") {
    await fs.cp(path.join("data", name), path.join(out, "data", name));
  }
}

const files = Object.keys(result.metafile.outputs).filter((file) => !file.endsWith(".map"));
console.log(`${out}: index.html, styles.css, images/, data/, ${files.map((file) => path.relative(out, file)).join(", ")}`);
