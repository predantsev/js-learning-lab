// Mistake: the job is marked done in its own write, before the transaction. When the rows then fail,
// the mark stays, and a retry skips a job whose rows were never stored.
export function importBatch(db, jobId, rows) {
  if (db.prepare('SELECT 1 FROM processed_jobs WHERE jobId = ?').get(jobId)) return false;
  db.prepare('INSERT INTO processed_jobs (jobId) VALUES (?)').run(jobId);
  db.exec('BEGIN');
  try {
    const insert = db.prepare('INSERT INTO expenses (title, amountMinor) VALUES (?, ?)');
    for (const row of rows) insert.run(row.title, row.amountMinor);
    db.exec('COMMIT');
    return true;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
