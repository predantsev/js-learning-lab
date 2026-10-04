// searchBooks(db, { title, sort }): the books whose title contains `title`, as { title, copies } rows.
// sort 'title' orders by title; sort 'copies' puts most copies first; any other sort is refused.
export function searchBooks(db, { title, sort }) {
  let order;
  if (sort === 'title') order = 'title ASC';
  else if (sort === 'copies') order = 'copies DESC';
  else throw new RangeError(`sort must be "title" or "copies", got ${sort}`);
  const sql = `SELECT title, copies FROM books WHERE title LIKE :pattern ORDER BY ${order}`;
  return db.prepare(sql).all({ pattern: '%' + title + '%' });
}
