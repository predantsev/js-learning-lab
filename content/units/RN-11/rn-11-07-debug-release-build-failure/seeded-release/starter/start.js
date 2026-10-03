import { seedDemoWishes } from './dev/seed.js';
import wishes from './wishes.json';

// Called once when the app starts; returns the wishes for the first screen.
export function startApp() {
  return seedDemoWishes(wishes);
}
