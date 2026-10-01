// Full build: course content → sandbox assets → application bundle.
import { build } from 'vite';
import { buildSandbox } from './build-sandbox.mjs';
import { buildContent } from './content/lib.mjs';

export async function buildAll({ quiet = false } = {}) {
  const { issues } = await buildContent({ quiet });
  if (issues.length > 0 && !quiet) console.warn(`content has ${issues.length} issue(s); run "npm run content:validate" for details`);
  await buildSandbox({ quiet: true });
  await build({ logLevel: quiet ? 'error' : 'warn' });
  // The application build empties dist/app only; content and sandbox assets stay next to it.
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const started = Date.now();
  await buildAll();
  console.log(`build finished in ${((Date.now() - started) / 1000).toFixed(1)} s`);
}
