// Startup recovery of the wishlist database (SQLite): detect damage, quarantine the damaged file,
// restore the newest verified backup and report. A missing database is not damage.
import { copyFileSync, existsSync, readFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Opens a database file and checks it. Returns the wish count, or throws with what is wrong.
export function checkDatabase(file) {
  const db = new DatabaseSync(file);
  try {
    // A file that is not a database at all fails here, on the first statement.
    const result = db.prepare('PRAGMA integrity_check').all().map((row) => row.integrity_check);
    if (result[0] !== 'ok') throw new Error(`integrity_check: ${result[0].split('\n').at(-1)}`);
    return db.prepare('SELECT count(*) AS count FROM wishes').get().count;
  } finally {
    db.close();
  }
}

// A backup counts only if it passes checkDatabase on a scratch copy and matches its manifest.
function verified(backupPath, scratchDir) {
  const scratch = path.join(scratchDir, 'verify.db');
  try {
    rmSync(scratch, { force: true });
    copyFileSync(backupPath, scratch);
    const manifest = JSON.parse(readFileSync(`${backupPath}.manifest.json`, 'utf8'));
    return checkDatabase(scratch) === manifest.count;
  } catch {
    return false;
  } finally {
    rmSync(scratch, { force: true });
  }
}

export function openDatabase(file, backupsDir, scratchDir, stamp) {
  if (!existsSync(file)) return { action: 'missing' };
  let damage;
  try {
    return { action: 'ok', count: checkDatabase(file) };
  } catch (error) {
    damage = error.message;
  }

  // Find the newest verified backup BEFORE touching the damaged file.
  const names = readdirSync(backupsDir).filter((name) => name.endsWith('.db')).sort().reverse();
  const chosen = names.find((name) => verified(path.join(backupsDir, name), scratchDir));
  if (chosen === undefined) throw new Error(`refusing to start: ${damage}, and no verified backup`);

  const quarantined = `${file}.corrupt-${stamp}`;
  renameSync(file, quarantined); // keep the evidence, never delete it
  copyFileSync(path.join(backupsDir, chosen), `${file}.restore.tmp`);
  renameSync(`${file}.restore.tmp`, file);
  return { action: 'restored', damage, quarantined: path.basename(quarantined), restoredFrom: chosen, count: checkDatabase(file) };
}
