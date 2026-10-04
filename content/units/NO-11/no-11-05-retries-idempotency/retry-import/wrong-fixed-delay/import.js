// importBatch(db, jobId, rows): stores the rows of one import job. Running it again with the same
// jobId must not store them twice. Returns true when it stored the rows, false when the job was done.
export function importBatch(db, jobId, rows) {
  db.exec('BEGIN');
  try {
    if (db.prepare('SELECT 1 FROM processed_jobs WHERE jobId = ?').get(jobId)) {
      db.exec('ROLLBACK');
      return false; // a retry of a job that already committed
    }
    const insert = db.prepare('INSERT INTO expenses (title, amountMinor) VALUES (?, ?)');
    for (const row of rows) insert.run(row.title, row.amountMinor);
    // Same transaction: the rows and the "done" mark are committed together, or neither is.
    db.prepare('INSERT INTO processed_jobs (jobId) VALUES (?)').run(jobId);
    db.exec('COMMIT');
    return true;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
