// The release record of a build artifact, and its verification.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sha256Of = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function createReleaseRecord(artifactPath, { name, version, commit, node }) {
  for (const [field, value] of Object.entries({ name, version, commit, node })) {
    if (value === undefined) throw new Error(`release record: ${field} is required`);
  }
  const bytes = await readFile(artifactPath); // a Buffer: the exact bytes, no text decoding
  const file = path.basename(artifactPath);
  const record = {
    name, version, commit, node,
    artifact: file,
    bytes: bytes.length,
    sha256: sha256Of(bytes),
    verify: [`shasum -a 256 ${file}`, `sha256sum ${file}`],
  };
  await writeFile(`${artifactPath}.release.json`, JSON.stringify(record, null, 2) + '\n');
  return record;
}

export async function verifyRelease(artifactPath) {
  const problems = [];
  let record;
  try {
    record = JSON.parse(await readFile(`${artifactPath}.release.json`, 'utf8'));
  } catch {
    return { ok: false, problems: ['no readable release record next to the artifact'] };
  }
  let bytes;
  try {
    bytes = await readFile(artifactPath);
  } catch {
    return { ok: false, problems: ['the artifact itself cannot be read'] };
  }
  if (bytes.length !== record.bytes) problems.push(`size ${bytes.length}, the record says ${record.bytes}`);
  if (sha256Of(bytes) !== record.sha256) problems.push('sha256 differs from the record');
  return { ok: problems.length === 0, problems };
}
