// backupStore and verifyBackup for the notes store.
// Mistake: it never compares the sha256 with the manifest.
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sha256Of } from './checksum.js';
import { parseStore } from './contract.js';

// backupStore(file, backupPath): copy the store and write backupPath + '.manifest.json'.
export async function backupStore(file, backupPath) {
  const text = await readFile(file, 'utf8'); // one read: the manifest describes exactly this text
  const manifest = { count: parseStore(text).records.length, sha256: sha256Of(text) };
  await writeFile(backupPath, text);
  await writeFile(`${backupPath}.manifest.json`, JSON.stringify(manifest));
  return manifest;
}

// verifyBackup(backupPath, scratchDir): restore into scratchDir and report
// { ok, count, sha256, problems } — never throw.
export async function verifyBackup(backupPath, scratchDir) {
  const problems = [];
  let manifest = null;
  try {
    manifest = JSON.parse(await readFile(`${backupPath}.manifest.json`, 'utf8'));
  } catch (error) {
    problems.push(`manifest: ${error.code ?? error.message}`);
  }
  let restoredText = '';
  try {
    const restored = path.join(scratchDir, 'restored.json');
    await copyFile(backupPath, restored);
    restoredText = await readFile(restored, 'utf8');
  } catch (error) {
    problems.push(`restore: ${error.code ?? error.message}`);
  }
  const sha256 = sha256Of(restoredText);
  let count = 0;
  try {
    count = parseStore(restoredText).records.length;
  } catch (error) {
    problems.push(`contract: ${error.problems?.join('; ') ?? error.message}`);
  }
  if (manifest && count !== manifest.count) problems.push(`count: expected ${manifest.count}, restored ${count}`);
  return { ok: problems.length === 0, count, sha256, problems };
}
