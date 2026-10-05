// The development build: `npm run build` bundles main.tsx into dist/ (as the esbuild command before it
// did) and puts the client configuration from .env into the bundle as CLIENT_ENV — only DATA_SOURCE and
// API_BASE_URL, never the whole environment. An invalid configuration stops the build with the reason.
import { build } from "esbuild";
import { loadClientConfig } from "../data/config.js";

const env = { DATA_SOURCE: process.env.DATA_SOURCE, API_BASE_URL: process.env.API_BASE_URL };
try {
  loadClientConfig(env);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

await build({
  entryPoints: ["main.tsx"],
  bundle: true,
  splitting: true,
  sourcemap: true,
  format: "esm",
  outdir: "dist",
  entryNames: "app",
  define: { CLIENT_ENV: JSON.stringify(env) },
  logLevel: "info",
});
