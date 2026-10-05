// Misconception: if the first attempt threw, it did nothing — so the job id is written but never read.
// importBatch(db, jobId, rows): stores the rows of one import job. Running it again with the same
// jobId must not store them twice. Returns true when it stored the rows, false when the job was done.
export function importBatch(db, jobId, rows) {
  db.exec('BEGIN');
  try {
    const insert = db.prepare('INSERT INTO expenses (title, amountMinor) VALUES (?, ?)');
    for (const row of rows) insert.run(row.title, row.amountMinor);
    // Same transaction: the rows and the "done" mark are committed together, or neither is.
    db.prepare('INSERT OR IGNORE INTO processed_jobs (jobId) VALUES (?)').run(jobId);
    db.exec('COMMIT');
    return true;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
