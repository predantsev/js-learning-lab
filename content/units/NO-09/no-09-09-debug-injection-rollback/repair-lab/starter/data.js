// The seeded library of this lab (read-only): 3 members, 3 books, 2 loans. Book 2 has no copy left.
export function seedLibrary(db) {
  db.exec(`
    INSERT INTO members (id, name) VALUES (1, '%%marta%%'), (2, '%%oleh%%'), (3, '%%borys%%');
    INSERT INTO books (id, title, available) VALUES (1, '%%lighthouse%%', 1), (2, '%%garden%%', 0), (3, '%%stars%%', 2);
    INSERT INTO loans (memberId, bookId, loanedOn) VALUES (1, 2, '2026-03-03'), (2, 1, '2026-03-04');
  `);
}
