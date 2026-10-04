// The client entry of the server-rendered list page: `npm run build:client` in server/ bundles
// ../ssr/client.ts (React, react-dom/client and the shared list component) into public/client.js, which
// GET /client.js serves. A development build: React's messages stay readable (a hydration mismatch says
// what differs). `node scripts/build-client.mjs --minify <out>` makes the production build that the release
// carries (scripts/build.mjs); React's production build then gives only error codes. The bundle may import
// nothing of the server: esbuild stops with "Could not resolve" if a node: module or a server file sneaks in.
import { build } from "esbuild";
import path from "node:path";

const SERVER = path.resolve(import.meta.dirname, "..");
const minify = process.argv.includes("--minify");
const out = process.argv.filter((arg) => !arg.startsWith("--"))[2] ?? path.join(SERVER, "public", "client.js");

await build({
  entryPoints: [path.join(SERVER, "..", "ssr", "client.ts")],
  bundle: true,
  format: "esm",
  platform: "browser",
  minify: minify, // with minify esbuild also defines process.env.NODE_ENV as "production"
  outfile: out,
  logLevel: "warning",
});
console.log(`${path.relative(process.cwd(), out)} (${minify ? "production" : "development"} build)`);
