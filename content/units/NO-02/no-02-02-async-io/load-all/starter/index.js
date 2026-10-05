// Loads three good files, then a set with a broken one, and prints what loadAll gives back.
import { loadAll } from './app.js';

const good = ['data/wishlist.json', 'data/planner.json', 'data/habits.json'];
try {
  const [wishes, tasks, habits] = await loadAll(good);
  console.log(`%%loaded%%: ${wishes.length} + ${tasks.length} + ${habits.length}`);
} catch (error) {
  console.log(`%%failed%%: ${error.message}`);
}

try {
  await loadAll(['data/wishlist.json', 'data/broken.json']);
  console.log('%%loaded%%');
} catch (error) {
  console.log(`%%failed%%: ${error.message}`);
  console.log(`  cause: ${error.cause?.name ?? '—'}`);
}
