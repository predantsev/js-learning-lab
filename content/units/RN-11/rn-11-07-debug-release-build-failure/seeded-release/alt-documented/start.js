import { seedDemoWishes } from './dev/seed.js';
import wishes from './wishes.json';

// Called once when the app starts. No password or key store is ever needed here.
export function startApp() {
  if (__DEV__) return seedDemoWishes(wishes);
  return wishes;
}
