import { seedDemoWishes } from './dev/seed.js';
import wishes from './wishes.json';

// Called once when the app starts; returns the wishes for the first screen.
// The demo wishes are a development aid: only a debug build adds them.
export function startApp() {
  return __DEV__ ? seedDemoWishes(wishes) : wishes;
}
