// Loads data/wishlist.json the way a server does on start: every record goes through the contract.
import { readFile } from 'node:fs/promises';
import { parseStore, wishContract } from './store-contract.js';

const text = await readFile('data/wishlist.json', 'utf8');
try {
  const store = parseStore(text, wishContract);
  console.log(`%%loaded%%: ${store.records.length}`);
  for (const wish of store.records) console.log(`  ${wish.id} ${wish.name}: category = ${wish.category}`);
} catch (error) {
  console.log(`%%rejected%%: ${error.message}`);
}
