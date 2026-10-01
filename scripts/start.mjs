// Start the platform: build what is missing or outdated, then serve on loopback.
//   npm start            → http://js-learning-lab.localhost:7300 (fallback http://localhost:7300)
//   JSLL_PORT=7310 npm start
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, loadConfig } from '../server/config.mjs';

const major = Number(process.versions.node.split('.')[0]);
if (major < 22) {
  console.error(`js-learning-lab needs Node.js 22 or newer (found ${process.version}). Install a current Node.js and run "npm start" again.`);
  process.exit(1);
}

async function newestMtime(dir) {
  let newest = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    newest = Math.max(newest, entry.isDirectory() ? await newestMtime(full) : (await fs.stat(full)).mtimeMs);
  }
  return newest;
}

const config = loadConfig();
const stamp = path.join(config.distDir, '.build-stamp');
const builtAt = await fs.stat(stamp).then((s) => s.mtimeMs, () => 0);
const sources = await Promise.all(['app', 'shared', 'sandbox', 'content', 'scripts'].map((d) => newestMtime(path.join(ROOT, d))));
const lock = await fs.stat(path.join(ROOT, 'package-lock.json')).then((s) => s.mtimeMs, () => 0);
if (process.argv.includes('--build') || builtAt < Math.max(...sources, lock)) {
  console.log('Building the application and course content (first start or sources changed)…');
  try {
    const { buildAll } = await import('./build.mjs');
    await buildAll({ quiet: true });
    await fs.writeFile(stamp, new Date().toISOString());
  } catch (error) {
    console.error('Build failed:', error.message);
    console.error('Did "npm install" finish without errors? Run it again, then "npm start".');
    process.exit(1);
  }
}

const { startServer } = await import('../server/app.mjs');
try {
  const server = await startServer();
  console.log(`\njs learning lab is running.\n\n  Open:      ${server.url}\n  Fallback:  ${server.fallbackUrl}\n\n  Learner data: ${server.config.dataDir}\n  Stop with Ctrl+C. Everything stays on this computer.\n`);
  const stop = async () => { await server.close(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
