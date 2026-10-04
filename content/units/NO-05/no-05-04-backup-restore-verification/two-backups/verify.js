// facts(db): what a restored expense database must match — row count, totals per category and a
// sha256 over every row in id order. verifyBackup restores a backup into a scratch file and compares.
import { createHash } from 'node:crypto';
import { copyFileSync, rmSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export function facts(db) {
  const rows = db.prepare('SELECT id, label, amountMinor, category FROM expenses ORDER BY id').all();
  const totals = {};
  for (const row of rows) totals[row.category] = (totals[row.category] ?? 0) + row.amountMinor;
  return {
    count: rows.length,
    totals: JSON.stringify(totals),
    sha256: createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 12),
  };
}

export function verifyBackup(backupPath, expected, scratchPath) {
  rmSync(scratchPath, { force: true });
  copyFileSync(backupPath, scratchPath); // restore into scratch: the live database is never touched
  const restored = new DatabaseSync(scratchPath);
  try {
    const integrity = restored.prepare('PRAGMA integrity_check').all().map((row) => row.integrity_check);
    if (integrity[0] !== 'ok') return { ok: false, problem: `integrity_check: ${integrity[0].split('\n')[1] ?? integrity[0]}` };
    const got = facts(restored);
    for (const key of Object.keys(expected)) {
      if (got[key] !== expected[key]) return { ok: false, problem: `${key}: expected ${expected[key]}, restored ${got[key]}` };
    }
    return { ok: true, ...got };
  } catch (error) {
    return { ok: false, problem: error.message };
  } finally {
    restored.close();
  }
}
