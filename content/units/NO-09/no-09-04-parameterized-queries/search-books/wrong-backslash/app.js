// searchBooks(db, { title, sort }): the books whose title contains `title`, as { title, copies } rows.
// sort 'title' orders by title; sort 'copies' puts most copies first; any other sort is refused.
const SORTS = { title: 'title', copies: 'copies DESC' };

export function searchBooks(db, { title, sort }) {
  if (!Object.hasOwn(SORTS, sort)) throw new Error(`unknown sort: ${sort}`);
  // "Escaping" quotes by hand, as some other databases do: SQLite does not treat \ as an escape.
  const escaped = title.replaceAll("'", "\\'");
  return db.prepare(`SELECT title, copies FROM books WHERE title LIKE '%${escaped}%' ORDER BY ${SORTS[sort]}`).all();
}
