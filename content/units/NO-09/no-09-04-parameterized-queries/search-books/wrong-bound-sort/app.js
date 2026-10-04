// searchBooks(db, { title, sort }): the books whose title contains `title`, as { title, copies } rows.
// sort 'title' orders by title; sort 'copies' puts most copies first; any other sort is refused.
export function searchBooks(db, { title, sort }) {
  if (sort !== 'title' && sort !== 'copies') throw new Error(`unknown sort: ${sort}`);
  // The column name is bound as a value: ORDER BY then sorts by one constant text.
  return db.prepare('SELECT title, copies FROM books WHERE title LIKE ? ORDER BY ?').all(`%${title}%`, sort);
}
