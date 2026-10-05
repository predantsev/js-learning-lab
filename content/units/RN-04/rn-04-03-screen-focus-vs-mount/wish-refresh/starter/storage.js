// Read-only: the wishlist's record store (in memory here; on a phone it reads native storage).
import { createMemoryStorage } from './memoryStorage.js';

export const storage = createMemoryStorage([
  { id: 'w-01', name: '%%headphones%%', acquired: false },
  { id: 'w-02', name: '%%lamp%%', acquired: false },
  { id: 'w-03', name: '%%bicycle%%', acquired: false },
]);
