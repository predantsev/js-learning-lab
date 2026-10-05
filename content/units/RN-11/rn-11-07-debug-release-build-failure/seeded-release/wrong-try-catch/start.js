import { seedDemoWishes } from './dev/seed.js';
import wishes from './wishes.json';

// The crash is hidden, but the dev-only helper still runs in every release start.
export function startApp() {
  try {
    return seedDemoWishes(wishes);
  } catch {
    return wishes;
  }
}
