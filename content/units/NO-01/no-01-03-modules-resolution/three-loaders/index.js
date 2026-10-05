// Three files, three extensions: each reports which loader evaluated it.
import { label as labelA } from './a.js';
import { label as labelB } from './b.cjs';
import { label as labelC } from './c.mjs';
// A bare specifier: the package name from package.json plus a subpath listed in its "exports".
import { currentStreak } from 'habit-kit/streak';

console.log(labelA);
console.log(labelB);
console.log(labelC);

const completions = ['2026-02-27', '2026-02-28', '2026-03-01'];
console.log(`%%streakLabel%%: ${currentStreak(completions, '2026-03-01')}`);
