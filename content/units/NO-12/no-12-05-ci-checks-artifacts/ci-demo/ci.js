// A local CI pipeline in miniature: every stage must pass before the next one starts, and only a
// fully green run leaves an artifact. Differences from your project's ci.mjs: the sandbox cannot
// start other programs, so "lint" here is a tiny stand-in with three rules instead of ESLint, there
// is no typecheck stage (tsc runs in your terminal), and the artifact is a gzipped JSON bundle
// instead of an npm pack tarball.
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { gzipSync } from 'node:zlib';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));

const stages = {
  async lint() {
    const problems = [];
    for (const name of await readdir('src')) {
      const lines = (await readFile(`src/${name}`, 'utf8')).split('\n');
      lines.forEach((line, i) => {
        if (/\bdebugger\b/.test(line)) problems.push(`src/${name}:${i + 1} debugger`);
        if (/console\.log\(/.test(line)) problems.push(`src/${name}:${i + 1} console.log in service code`);
        if (/\.only\(/.test(line)) problems.push(`src/${name}:${i + 1} .only leaves other tests out`);
      });
    }
    if (problems.length > 0) throw new Error(problems.join('\n'));
  },
  async test() {
    const { checks } = await import('./checks.js');
    for (const [name, check] of Object.entries(checks)) {
      try {
        await check();
        console.log(`  ✔ ${name}`);
      } catch (error) {
        throw new Error(`✖ ${name}: ${error.message}`);
      }
    }
  },
  async build() {
    await rm('release-demo', { recursive: true, force: true });
    await mkdir('release-demo');
    for (const name of await readdir('src')) {
      await writeFile(`release-demo/${name.replace(/\.ts$/, '.js')}`, stripTypeScriptTypes(await readFile(`src/${name}`, 'utf8')));
    }
  },
  async pack() {
    const bundle = { name: pkg.name, version: pkg.version, files: {} };
    for (const name of await readdir('release-demo')) bundle.files[name] = await readFile(`release-demo/${name}`, 'utf8');
    await mkdir('artifacts', { recursive: true });
    const file = `artifacts/${pkg.name}-${pkg.version}.bundle.gz`;
    const bytes = gzipSync(JSON.stringify(bundle), { level: 9 });
    await writeFile(file, bytes);
    console.log(`  ${file}: ${bytes.length} bytes, sha256 ${createHash('sha256').update(bytes).digest('hex')}`);
  },
};

export async function runPipeline() {
  await rm('artifacts', { recursive: true, force: true });
  for (const [name, stage] of Object.entries(stages)) {
    console.log(`▶ ${name}`);
    try {
      await stage();
    } catch (error) {
      console.log(`✖ %%stopped%% "${name}":\n${error.message}`);
      return false;
    }
  }
  return true;
}
