// A tiny migrator: numbered migrations, the version kept in PRAGMA user_version, each step in a transaction.
import { DatabaseSync } from 'node:sqlite';

const migrations = [
  {
    version: 1,
    name: '001 create tables',
    up: `
      CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL);
      CREATE TABLE loans (id INTEGER PRIMARY KEY, memberId INTEGER NOT NULL REFERENCES members(id),
                          bookId INTEGER NOT NULL REFERENCES books(id), loanedOn TEXT NOT NULL, returnedOn TEXT);
    `,
  },
  { version: 2, name: '002 add loans.dueOn', up: 'ALTER TABLE loans ADD COLUMN dueOn TEXT' },
  { version: 3, name: '003 index loans by member', up: 'CREATE INDEX loans_member ON loans (memberId)' },
];

const versionOf = (db) => db.prepare('PRAGMA user_version').get().user_version;

function migrate(db) {
  const applied = [];
  for (const migration of migrations) {
    if (migration.version <= versionOf(db)) continue; // already applied to this database
    db.exec('BEGIN');
    try {
      db.exec(migration.up);
      db.exec(`PRAGMA user_version = ${migration.version}`); // a number from our own list, never from input
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw new Error(`migration ${migration.name} failed: ${error.message}`, { cause: error });
    }
    applied.push(migration.version);
  }
  return applied;
}

function seed(db) {
  if (db.prepare('SELECT COUNT(*) AS n FROM members').get().n > 0) return 0; // only an empty table is seeded
  db.exec("INSERT INTO members (name) VALUES ('%%marta%%'), ('%%oleh%%')");
  db.exec("INSERT INTO books (title) VALUES ('%%lighthouse%%')");
  db.exec("INSERT INTO loans (memberId, bookId, loanedOn) VALUES (1, 1, '2026-03-01')");
  return 2;
}

const columns = (db) => db.prepare('PRAGMA table_info(loans)').all().map((c) => c.name).join(', ');
const report = (label, db) =>
  console.log(`${label}: version ${versionOf(db)}, members ${db.prepare('SELECT COUNT(*) AS n FROM members').get().n}, loans(${columns(db)})`);

// 1. A brand-new database.
const fresh = new DatabaseSync(':memory:');
console.log('empty db, migrate →', migrate(fresh));
console.log('empty db, seed →', seed(fresh), 'members added');
console.log('empty db, migrate again →', migrate(fresh));
console.log('empty db, seed again →', seed(fresh), 'members added');
report('empty db', fresh);

// 2. An older database: created with migration 001 only, already holding data.
const older = new DatabaseSync(':memory:');
older.exec(migrations[0].up);
older.exec('PRAGMA user_version = 1');
older.exec(`
  INSERT INTO members (name) VALUES ('%%borys%%'), ('%%taras%%'), ('%%anna%%');
  INSERT INTO books (title) VALUES ('%%stars%%');
  INSERT INTO loans (memberId, bookId, loanedOn) VALUES (1, 1, '2026-02-20'), (3, 1, '2026-02-27');
`);
report('older db before', older);
try {
  console.log('older db, migrate →', migrate(older));
} catch (error) {
  console.log('older db, migrate failed:', error.message);
}
console.log('older db, seed →', seed(older), 'members added');
report('older db after', older);
