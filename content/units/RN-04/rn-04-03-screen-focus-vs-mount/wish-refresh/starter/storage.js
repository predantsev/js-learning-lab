// Read-only: the wishlist's storage adapter (in memory here; a native one on a phone).
import { createMemoryStorage } from './memoryStorage.js';

export const storage = createMemoryStorage([
  { id: 'w-01', name: '%%headphones%%', acquired: false },
  { id: 'w-02', name: '%%lamp%%', acquired: false },
  { id: 'w-03', name: '%%bicycle%%', acquired: false },
]);
