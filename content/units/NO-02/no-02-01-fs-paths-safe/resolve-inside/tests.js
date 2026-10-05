// resolveInside is called with an absolute data folder under the exercise's .tmp/ folder.
import path from 'node:path';
import { resolveInside } from './app.js';

const base = tmp('data');
const isInside = (p) => typeof p === 'string' && p.startsWith(base + path.sep);
const rejects = (name) => {
  expect(typeof resolveInside, 'type of resolveInside').toBe('function');
  expect(() => resolveInside(base, name), `resolveInside(base, "${name}")`).toThrow();
};

test('a plain name gives an absolute path inside the folder', () => {
  expect(typeof resolveInside, 'type of resolveInside').toBe('function');
  expect(resolveInside(base, 'wishlist.json'), 'resolveInside(base, "wishlist.json")').toBe(path.join(base, 'wishlist.json'));
  expect(resolveInside(base, 'archive/2026-03.json'), 'resolveInside(base, "archive/2026-03.json")').toBe(path.join(base, 'archive', '2026-03.json'));
});

test('a name with .. that stays inside is allowed', () => {
  expect(typeof resolveInside, 'type of resolveInside').toBe('function');
  expect(resolveInside(base, 'archive/../planner.json'), 'resolveInside(base, "archive/../planner.json")').toBe(path.join(base, 'planner.json'));
});

test('a name that climbs out with .. is rejected', () => {
  rejects('../secrets.txt');
  rejects('archive/../../secrets.txt');
});

test('an absolute name is rejected', () => {
  rejects('/etc/hosts');
});

test('a neighbour folder whose name starts the same is rejected', () => {
  rejects('../data-backup/wishlist.json');
});

test('a name built to survive stripping never lands outside', () => {
  expect(typeof resolveInside, 'type of resolveInside').toBe('function');
  let result;
  try {
    result = resolveInside(base, '....//secrets.txt');
  } catch {
    return; // rejecting it is fine too
  }
  expect(isInside(result), `resolveInside(base, "....//secrets.txt") = ${JSON.stringify(result)} is inside the folder`).toBe(true);
});
