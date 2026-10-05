// Three searches through searchBooks: an ordinary one, a quote and an injection attempt.
import { createCatalog } from './catalog.js';
import { searchBooks } from './app.js';

const db = createCatalog();
const attempts = [
  { title: '%%term%%', sort: 'title' },
  { title: '', sort: 'copies' },
  { title: "'", sort: 'title' },
  { title: "%' OR 1=1 --", sort: 'title' },
  { title: '', sort: 'copies; DROP TABLE books' },
];
for (const query of attempts) {
  try {
    const rows = searchBooks(db, query);
    console.log(JSON.stringify(query), '→', rows.map((b) => `${b.title} (${b.copies})`).join(', ') || 'nothing');
  } catch (error) {
    console.log(JSON.stringify(query), '→', error.message);
  }
}
db.close();
