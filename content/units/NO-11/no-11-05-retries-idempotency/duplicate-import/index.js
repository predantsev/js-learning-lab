// An import step that commits its rows and then loses the answer (a timeout after the write),
// retried by a naive loop. With CHECK_JOB_ID the step records its job id in the same transaction.
import { DatabaseSync } from 'node:sqlite';

const CHECK_JOB_ID = false; // try true
const FAILS_AFTER_WRITE = 1; // how many attempts commit and then "time out"; try 2

const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE expenses (id INTEGER PRIMARY KEY, title TEXT NOT NULL, amountMinor INTEGER NOT NULL);
  CREATE TABLE processed_jobs (jobId TEXT PRIMARY KEY);
`);

const rows = [
  { title: '%%coffee%%', amountMinor: 4500 },
  { title: '%%bus%%', amountMinor: 1200 },
  { title: '%%bread%%', amountMinor: 3800 },
];

let attempt = 0;
function importStep(jobId) {
  attempt += 1;
  db.exec('BEGIN');
  try {
    if (CHECK_JOB_ID && db.prepare('SELECT 1 FROM processed_jobs WHERE jobId = ?').get(jobId)) {
      db.exec('ROLLBACK');
      console.log(`  %%attempt%% ${attempt}: %%alreadyDone%% ${jobId}`);
      return;
    }
    const insert = db.prepare('INSERT INTO expenses (title, amountMinor) VALUES (?, ?)');
    for (const row of rows) insert.run(row.title, row.amountMinor);
    if (CHECK_JOB_ID) db.prepare('INSERT INTO processed_jobs (jobId) VALUES (?)').run(jobId);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  // The rows are committed — but the caller never hears about it.
  if (attempt <= FAILS_AFTER_WRITE) throw new Error('%%timeout%%');
  console.log(`  %%attempt%% ${attempt}: %%ok%%`);
}

// A naive retry: try again at once, up to 3 attempts, whatever the error.
for (let i = 1; i <= 3; i++) {
  try {
    importStep('job-2026-03-01');
    break;
  } catch (error) {
    console.log(`  %%attempt%% ${attempt}: ${error.message}`);
  }
}
const { count, total } = db.prepare('SELECT COUNT(*) AS count, SUM(amountMinor) AS total FROM expenses').get();
console.log(`%%rows%%: ${count}, %%total%%: ${total}`);
db.close();
