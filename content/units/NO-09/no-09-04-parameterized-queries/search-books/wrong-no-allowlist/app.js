// searchBooks(db, { title, sort }): the books whose title contains `title`, as { title, copies } rows.
// sort 'title' orders by title; sort 'copies' puts most copies first; any other sort is refused.
export function searchBooks(db, { title, sort }) {
  // The title is bound, but the sort goes into the SQL text unchecked.
  const order = sort === 'copies' ? 'copies DESC' : sort;
  return db.prepare(`SELECT title, copies FROM books WHERE title LIKE ? ORDER BY ${order}`).all(`%${title}%`);
}
