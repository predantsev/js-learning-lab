// Serves one release folder the way a static host would: `npm run preview` serves the version in
// package.json, `npm run preview -- 0.9.0` another one (a rollback). Only on 127.0.0.1, on PORT from
// .env — the same address as `npm start`, so the app sees the same saved data (stop `npm start` first).
// Cache rules: index.html must be asked for every time ("no-cache"), so a new release is seen at once;
// the files in dist/ have a hash in their names and never change, so they may be kept a year.
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
const version = process.argv[2] ?? pkg.version;
const root = path.resolve("releases", version);
const port = Number(process.env.PORT ?? "4310");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

try {
  await fs.access(path.join(root, "index.html"));
} catch {
  console.error(`No release ${version}: run \`npm run release\` first (releases/${version}/index.html is missing).`);
  process.exit(1);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const name = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const file = path.resolve(root, name);
  if (request.method !== "GET" || !file.startsWith(root + path.sep)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const body = await fs.readFile(file);
    const hashed = name.startsWith("dist/");
    response.writeHead(200, {
      "content-type": TYPES[path.extname(file)] ?? "application/octet-stream",
      "cache-control": hashed ? "public, max-age=31536000, immutable" : "no-cache",
    });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});
server.listen(port, "127.0.0.1", () => console.log(`release ${version}: http://127.0.0.1:${port}/`));
