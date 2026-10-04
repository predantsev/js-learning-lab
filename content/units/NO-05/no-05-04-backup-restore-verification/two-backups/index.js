// Two backups of a running expense database: a plain file copy taken while a write is in progress,
// and a snapshot through SQLite's backup API. Each is restored into scratch and verified.
//
// How this differs from a real server: the "write in progress" is one big transaction in this same
// process, and `cache_size = 10` (pages) makes SQLite move changed pages into expenses.db before
// COMMIT (while expenses.db-journal keeps the old ones). A real server's writes are smaller and the
// moment of a copy is random, so a real naive copy is broken only sometimes — which is worse.
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import sqlite, { DatabaseSync } from 'node:sqlite';
import { facts, verifyBackup } from './verify.js';

rmSync('data', { recursive: true, force: true });
mkdirSync('data/backups', { recursive: true });

const fixtures = [
  ['%%groceries%%', 'food'], ['%%pass%%', 'transport'], ['%%coffee%%', 'fun'],
  ['%%bulbs%%', 'home'], ['%%cinema%%', 'fun'], ['%%lunch%%', 'food'],
];
const db = new DatabaseSync('data/expenses.db');
db.exec('PRAGMA cache_size = 10');
db.exec(`CREATE TABLE expenses (
  id TEXT PRIMARY KEY, label TEXT NOT NULL,
  amountMinor INTEGER NOT NULL CHECK (amountMinor > 0), category TEXT NOT NULL
)`);
const insert = db.prepare('INSERT INTO expenses VALUES (?, ?, ?, ?)');
db.exec('BEGIN');
for (let i = 1; i <= 2000; i++) {
  const [label, category] = fixtures[i % fixtures.length];
  insert.run(`e-${String(i).padStart(4, '0')}`, `${label} ${i}`, 1000 + (i % 97) * 50, category);
}
db.exec('COMMIT');
const committed = facts(db); // what any correct backup taken now must restore to
console.log(`%%source%%: ${JSON.stringify(committed)}`);

// Backup 1: SQLite's online backup API from a second connection — a consistent snapshot.
// sqlite.backup() exists from Node 22.16; VACUUM INTO does the same in your own terminal, but the
// course runner refuses it (it can open a file outside the exercise folder).
const names = ['naive-copy'];
if (typeof sqlite.backup === 'function') {
  const backupConnection = new DatabaseSync('data/expenses.db');
  await sqlite.backup(backupConnection, 'data/backups/snapshot.db');
  backupConnection.close();
  names.push('snapshot');
} else {
  console.log(`%%noBackupApi%% ${process.version}`);
}

// Backup 2: a plain file copy while a write transaction is still running.
db.exec('BEGIN');
db.exec("UPDATE expenses SET amountMinor = amountMinor + 1, label = label || ' *'");
copyFileSync('data/expenses.db', 'data/backups/naive-copy.db');
db.exec('COMMIT');
db.close();

for (const name of names) {
  const report = verifyBackup(`data/backups/${name}.db`, committed, `data/restore-${name}.db`);
  console.log(`${name}: ${report.ok ? `%%verified%% ${JSON.stringify(report)}` : `%%failed%% — ${report.problem}`}`);
}
