// Damages the wishlist database in two ways, then removes it, and starts it after each.
import { copyFileSync, mkdirSync, openSync, readdirSync, rmSync, writeFileSync, writeSync, closeSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase } from './recovery.js';

const KEEP_BACKUPS = true; // try false: no backups at all

rmSync('data', { recursive: true, force: true });
mkdirSync('data/backups', { recursive: true });
mkdirSync('data/scratch', { recursive: true });

const wishes = [
  ['w-01', '%%headphones%%', 80], ['w-02', '%%lamp%%', 45], ['w-03', '%%bicycle%%', 240],
  ['w-04', '%%book%%', 25], ['w-05', '%%tickets%%', null], ['w-06', '%%mug%%', 18],
];
const db = new DatabaseSync('data/wishlist.db');
db.exec('CREATE TABLE wishes (id TEXT PRIMARY KEY, name TEXT NOT NULL, price INTEGER CHECK (price >= 0))');
const add = (wish) => db.prepare('INSERT INTO wishes VALUES (?, ?, ?)').run(...wish);

// Backups are copied while the database is closed (no transaction can be in progress), each with a manifest.
function backup(stamp, count) {
  db.close();
  copyFileSync('data/wishlist.db', `data/backups/wishlist.${stamp}.db`);
  writeFileSync(`data/backups/wishlist.${stamp}.db.manifest.json`, JSON.stringify({ count }));
  db.open();
}
for (const wish of wishes.slice(0, 5)) add(wish);
if (KEEP_BACKUPS) backup('2026-03-01', 5);
add(wishes[5]);
if (KEEP_BACKUPS) backup('2026-03-02', 6);
db.close();
// The newest backup is broken: a copy that stopped half-way.
if (KEEP_BACKUPS) {
  copyFileSync('data/wishlist.db', 'data/backups/wishlist.2026-03-03.db');
  writeFileSync('data/backups/wishlist.2026-03-03.db', '');
  writeFileSync('data/backups/wishlist.2026-03-03.db.manifest.json', JSON.stringify({ count: 6 }));
}

function start(label, stamp) {
  try {
    console.log(`${label}: ${JSON.stringify(openDatabase('data/wishlist.db', 'data/backups', 'data/scratch', stamp))}`);
  } catch (error) {
    console.log(`${label}: ${error.message}`);
  }
}

start('%%intact%%', 't1');

const fd = openSync('data/wishlist.db', 'r+'); // overwrite the start of page 2, where the rows live
writeSync(fd, Buffer.alloc(600, 0x41), 0, 600, 4096);
closeSync(fd);
start('%%damagedPage%%', 't2');

writeFileSync('data/wishlist.db', '%%notADatabase%%');
start('%%notADb%%', 't3');

rmSync('data/wishlist.db', { force: true });
start('%%missing%%', 't4');

console.log(`data/: ${readdirSync('data').sort().join(', ')}`);
