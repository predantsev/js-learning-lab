// Tries five names against the data folder and prints which ones resolveInside allows.
import path from 'node:path';
import { resolveInside } from './app.js';

const baseDir = path.join(import.meta.dirname, 'data');
const names = ['wishlist.json', 'archive/2026-03.json', 'archive/../wishlist.json', '../config/.env', '/etc/hosts'];

for (const name of names) {
  try {
    const target = resolveInside(baseDir, name);
    console.log(`✔ ${name} → ${path.relative(import.meta.dirname, target)}`);
  } catch (error) {
    console.log(`✖ ${name}: ${error.message}`);
  }
}
