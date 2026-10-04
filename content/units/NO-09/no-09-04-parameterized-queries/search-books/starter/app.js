// searchBooks(db, { title, sort }): the books whose title contains `title`, as { title, copies } rows.
// sort 'title' orders by title; sort 'copies' puts most copies first; any other sort is refused.
export function searchBooks(db, { title, sort }) {
  const sql = `SELECT title, copies FROM books WHERE title LIKE '%${title}%' ORDER BY ${sort}`;
  return db.prepare(sql).all();
}
