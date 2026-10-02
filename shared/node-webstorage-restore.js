// Puts Node's `localStorage` global back after Babel has loaded (see node-webstorage-hide.js).
import { hiddenWebStorage } from './node-webstorage-hide.js';

if (hiddenWebStorage) Object.defineProperty(globalThis, 'localStorage', hiddenWebStorage);
