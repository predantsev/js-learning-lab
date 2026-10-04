// The release record of a build artifact, and its verification.
// This version hashes the file as a stream, which also works for artifacts larger than memory.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

async function digest(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

export async function createReleaseRecord(artifactPath, meta) {
  const missing = ['name', 'version', 'commit', 'node'].filter((key) => !meta[key]?.trim?.());
  if (missing.length) throw new Error(`cannot record a release without: ${missing.join(', ')}`);
  const name = basename(artifactPath);
  const record = {
    name: meta.name, version: meta.version, commit: meta.commit, node: meta.node,
    artifact: name,
    bytes: (await stat(artifactPath)).size,
    sha256: await digest(artifactPath),
    verify: [`sha256sum ${name}`, `shasum -a 256 ${name}`],
  };
  await writeFile(artifactPath + '.release.json', JSON.stringify(record));
  return record;
}

export async function verifyRelease(artifactPath) {
  const record = await readFile(artifactPath + '.release.json', 'utf8').then(JSON.parse, () => null);
  if (!record) return { ok: false, problems: ['the release record is missing'] };
  const problems = [];
  const { size } = await stat(artifactPath);
  if (size !== record.bytes) problems.push('the size changed');
  if ((await digest(artifactPath)) !== record.sha256) problems.push('the checksum changed');
  return { ok: !problems.length, problems };
}
