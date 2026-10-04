// The release record of a build artifact, and its verification.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sha256Of = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function createReleaseRecord(artifactPath, { name, version, commit, node }) {
  for (const [field, value] of Object.entries({ name, version, commit, node })) {
    if (typeof value !== 'string' || value.trim() === '') throw new Error(`release record: ${field} is required`);
  }
  const text = await readFile(artifactPath, 'utf8');
  const bytes = { length: (await readFile(artifactPath)).length, text };
  const file = path.basename(artifactPath);
  const record = {
    name, version, commit, node,
    artifact: file,
    bytes: bytes.length,
    sha256: sha256Of(bytes.text),
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
  const bytes = await readFile(artifactPath);
  const text = await readFile(artifactPath, 'utf8');
  if (bytes.length !== record.bytes) problems.push(`size ${bytes.length}, the record says ${record.bytes}`);
  if (sha256Of(text) !== record.sha256) problems.push('sha256 differs from the record');
  return { ok: problems.length === 0, problems };
}
