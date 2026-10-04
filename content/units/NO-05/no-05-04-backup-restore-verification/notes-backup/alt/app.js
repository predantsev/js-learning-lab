// Another valid shape: a helper turns any thrown error into a result, and the checks become a list.
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sha256Of } from './checksum.js';
import { parseStore } from './contract.js';

export async function backupStore(file, backupPath) {
  const text = await readFile(file, 'utf8');
  const store = parseStore(text);
  await writeFile(backupPath, text);
  const manifest = { sha256: sha256Of(text), count: store.records.length };
  await writeFile(backupPath + '.manifest.json', JSON.stringify(manifest, null, 2));
  return manifest;
}

async function attempt(work) {
  try {
    return { value: await work() };
  } catch (error) {
    return { error: error.problems ? error.problems.join(', ') : error.message };
  }
}

export async function verifyBackup(backupPath, scratchDir) {
  const restoredPath = path.join(scratchDir, 'restored.json');
  const manifest = await attempt(async () => JSON.parse(await readFile(backupPath + '.manifest.json', 'utf8')));
  const restored = await attempt(async () => {
    await copyFile(backupPath, restoredPath);
    return readFile(restoredPath, 'utf8');
  });
  const text = restored.value ?? '';
  const store = await attempt(() => parseStore(text));
  const count = store.value?.records.length ?? 0;
  const sha256 = sha256Of(text);
  const checks = [
    [manifest.error === undefined, `no readable manifest (${manifest.error})`],
    [restored.error === undefined, `restore failed (${restored.error})`],
    [manifest.value === undefined || manifest.value.sha256 === sha256, 'checksum differs from the manifest'],
    [store.error === undefined, `restored store is invalid (${store.error})`],
    [manifest.value === undefined || manifest.value.count === count, 'record count differs from the manifest'],
  ];
  const problems = checks.filter(([passed]) => !passed).map(([, message]) => message);
  return { ok: problems.length === 0, count, sha256, problems };
}
