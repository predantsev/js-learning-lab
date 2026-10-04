// The build: strips the types out of src/*.ts into plain JavaScript in release/ and records what was
// built. The artifact then runs on Node 22.13+ without type stripping, and the same files go to
// every machine. (tsc does the same with checks; node:module's stripTypeScriptTypes is from 22.13.)
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
await rm('release', { recursive: true, force: true });
await mkdir('release');
for (const name of await readdir('src')) {
  const javascript = stripTypeScriptTypes(await readFile(`src/${name}`, 'utf8'))
    .replace(/(from\s+'\.\/[\w-]+)\.ts'/g, "$1.js'"); // './tasks.ts' → './tasks.js'
  await writeFile(`release/${name.replace(/\.ts$/, '.js')}`, javascript);
}
await writeFile('release/build-info.json', JSON.stringify({ name: pkg.name, version: pkg.version, node: process.version }));
console.log(`built ${pkg.name} ${pkg.version}: ${(await readdir('release')).join(', ')}`);
