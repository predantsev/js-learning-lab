// Builds the clubs database from schema.js, fills it and tries two rows that must be refused.
// Each part runs in its own try/catch, so an unfinished schema shows which part fails.
import { DatabaseSync } from 'node:sqlite';
import { schema } from './schema.js';

const db = new DatabaseSync(':memory:');
const step = (label, run) => {
  try {
    const result = run();
    console.log(`${label}: ${result ?? 'ok'}`);
  } catch (error) {
    console.log(`${label}: ${error.message}`);
  }
};

step('create tables', () => db.exec(schema));
step('tables', () => db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all().map((t) => t.name).join(', '));
step('fill', () => db.exec(`
  INSERT INTO students (id, name) VALUES (1, '%%lina%%'), (2, '%%denys%%');
  INSERT INTO clubs (id, title) VALUES (1, '%%chess%%'), (2, '%%choir%%');
  INSERT INTO memberships (studentId, clubId, joinedOn) VALUES (1, 1, '2026-09-01'), (1, 2, '2026-09-03'), (2, 1, '2026-09-05');
`));
step('memberships', () => db.prepare('SELECT * FROM memberships').all().length);
step('unknown student 9 joins a club', () => db.exec("INSERT INTO memberships (studentId, clubId, joinedOn) VALUES (9, 1, '2026-09-07')"));
step('student 1 joins club 1 again', () => db.exec("INSERT INTO memberships (studentId, clubId, joinedOn) VALUES (1, 1, '2026-09-08')"));
db.close();
