// Two import jobs through retry(): one whose first attempt commits and then times out, and one with
// a row that breaks a rule of the table (a ValidationError, not worth repeating).
import { createDb, countExpenses } from './db.js';
import { ValidationError } from './errors.js';
import { importBatch } from './import.js';
import { retry } from './retry.js';

const db = createDb();
const options = { maxAttempts: 4, baseMs: 50, isRetryable: (error) => !(error instanceof ValidationError) };

async function runJob(jobId, rows, failFirstAfterWrite) {
  const started = performance.now();
  try {
    await retry(async (attempt) => {
      console.log(`  ${jobId}: %%attempt%% ${attempt} %%at%% ${(performance.now() - started).toFixed(0)} %%ms%%`);
      if (rows.some((row) => !(row.amountMinor > 0))) throw new ValidationError('%%badAmount%%');
      importBatch(db, jobId, rows);
      if (failFirstAfterWrite && attempt === 1) throw new Error('%%timeout%%');
    }, options);
    console.log(`${jobId}: %%ok%%`);
  } catch (error) {
    console.log(`${jobId}: ${error.name}: ${error.message}`);
  }
}

await runJob('job-1', [{ title: '%%coffee%%', amountMinor: 4500 }, { title: '%%bus%%', amountMinor: 1200 }], true);
await runJob('job-2', [{ title: '%%bread%%', amountMinor: -3800 }], false);
console.log(`%%rows%%: ${countExpenses(db)}`);
db.close();
