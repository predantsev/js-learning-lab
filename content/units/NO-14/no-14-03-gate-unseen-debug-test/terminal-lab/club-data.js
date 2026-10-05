// The book club's schema and synthetic fixtures (read-only).
// freshClub(name): writes a new SQLite file <name>.db in the working folder → the file name.
import { rmSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export const SCHEMA = `
  CREATE TABLE members (id TEXT PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE books (id TEXT PRIMARY KEY, title TEXT NOT NULL);
  CREATE TABLE reads (
    id INTEGER PRIMARY KEY,
    memberId TEXT NOT NULL REFERENCES members(id),
    bookId TEXT NOT NULL REFERENCES books(id),
    pages INTEGER NOT NULL CHECK (pages > 0)
  );
  CREATE TABLE votes (
    memberId TEXT NOT NULL REFERENCES members(id),
    bookId TEXT NOT NULL REFERENCES books(id),
    PRIMARY KEY (memberId, bookId)
  );
`;

export const MEMBERS = [
  { id: 'm-01', name: `%%lina%%` },
  { id: 'm-02', name: `%%denys%%` },
  { id: 'm-03', name: `%%olya%%` },
  { id: 'm-04', name: `%%yarema%%` },
  { id: 'm-05', name: `%%sofia%%` },
];
export const BOOKS = [
  { id: 'b-01', title: `%%harbour%%` },
  { id: 'b-02', title: `%%windMap%%` },
  { id: 'b-03', title: `%%hundredSteps%%` },
];
// Pages each member logged so far, and their votes for the next book.
export const READS = [
  { memberId: 'm-01', bookId: 'b-01', pages: 40 },
  { memberId: 'm-02', bookId: 'b-01', pages: 25 },
  { memberId: 'm-02', bookId: 'b-02', pages: 30 },
  { memberId: 'm-04', bookId: 'b-03', pages: 12 },
];
export const VOTES = [
  { memberId: 'm-01', bookId: 'b-02' },
  { memberId: 'm-03', bookId: 'b-02' },
  { memberId: 'm-03', bookId: 'b-03' },
];

export function freshClub(name) {
  const file = `${name}.db`;
  rmSync(file, { force: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  for (const m of MEMBERS) db.prepare('INSERT INTO members (id, name) VALUES (?, ?)').run(m.id, m.name);
  for (const b of BOOKS) db.prepare('INSERT INTO books (id, title) VALUES (?, ?)').run(b.id, b.title);
  for (const r of READS) db.prepare('INSERT INTO reads (memberId, bookId, pages) VALUES (?, ?, ?)').run(r.memberId, r.bookId, r.pages);
  for (const v of VOTES) db.prepare('INSERT INTO votes (memberId, bookId) VALUES (?, ?)').run(v.memberId, v.bookId);
  db.close();
  return file;
}
