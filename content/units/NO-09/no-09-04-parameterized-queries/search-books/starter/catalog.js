// The catalog used by index.js and by the checks (read-only).
import { DatabaseSync } from 'node:sqlite';

export function createCatalog() {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL, copies INTEGER NOT NULL)');
  const insert = db.prepare('INSERT INTO books (title, copies) VALUES (?, ?)');
  insert.run('%%lighthouse%%', 2);
  insert.run('%%winter%%', 4);
  insert.run('%%stars%%', 3);
  insert.run('%%spring%%', 1);
  return db;
}
