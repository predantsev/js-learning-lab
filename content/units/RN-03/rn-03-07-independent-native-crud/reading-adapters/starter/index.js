// index.js: a small demo of your adapters and repository. Do not edit.
import { createFixedClock, createMemoryStorage, createProgressFormat, createReadingRepository } from './adapters.ts';
import { summarizeBooks } from './readingList.js';

const storage = createMemoryStorage();
const repository = createReadingRepository({ storage, clock: createFixedClock('2026-03-01') });
const format = createProgressFormat('%%locale%%');

try {
  console.log('add:', JSON.stringify(await repository.add({ id: 'b-01', title: '  %%poems%%  ', pagesTotal: 120 })));
  console.log('add:', JSON.stringify(await repository.add({ id: 'b-02', title: '', pagesTotal: 0 })));
  await repository.finish('b-01');
  const books = await repository.load();
  console.log('books:', JSON.stringify(books));
  console.log('summary:', JSON.stringify(summarizeBooks(books)));
  console.log('progress 30 / 120:', format.progress(30, 120));
} catch (error) {
  console.log('demo stopped:', error.message);
}
