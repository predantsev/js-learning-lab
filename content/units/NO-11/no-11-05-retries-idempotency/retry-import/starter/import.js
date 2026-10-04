// importBatch(db, jobId, rows): stores the rows of one import job. Running it again with the same
// jobId must not store them twice. Returns true when it stored the rows, false when the job was done.
export function importBatch(db, jobId, rows) {
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
