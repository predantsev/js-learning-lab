import { seedDemoWishes } from './dev/seed.js';
import wishes from './wishes.json';

export function startApp() {
  if (!__DEV__) return wishes;
  return seedDemoWishes(wishes);
}
