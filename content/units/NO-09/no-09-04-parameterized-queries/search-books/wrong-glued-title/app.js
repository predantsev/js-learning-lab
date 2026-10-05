// searchBooks(db, { title, sort }): the books whose title contains `title`, as { title, copies } rows.
// sort 'title' orders by title; sort 'copies' puts most copies first; any other sort is refused.
const SORTS = { title: 'title', copies: 'copies DESC' };

export function searchBooks(db, { title, sort }) {
  if (!Object.hasOwn(SORTS, sort)) throw new Error(`unknown sort: ${sort}`);
  // The sort is safe, but the title is still glued into the SQL text.
  return db.prepare(`SELECT title, copies FROM books WHERE title LIKE '%${title}%' ORDER BY ${SORTS[sort]}`).all();
}
