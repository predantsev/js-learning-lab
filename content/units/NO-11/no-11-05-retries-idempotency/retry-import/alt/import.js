// Alternative: INSERT OR IGNORE into processed_jobs first, inside the transaction; no row changed
// means the job was already done.
export function importBatch(db, jobId, rows) {
  db.exec('BEGIN');
  try {
    const marked = db.prepare('INSERT OR IGNORE INTO processed_jobs (jobId) VALUES (?)').run(jobId);
    if (marked.changes === 0) {
      db.exec('COMMIT');
      return false;
    }
    for (const row of rows) {
      db.prepare('INSERT INTO expenses (title, amountMinor) VALUES (?, ?)').run(row.title, row.amountMinor);
    }
    db.exec('COMMIT');
    return true;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
