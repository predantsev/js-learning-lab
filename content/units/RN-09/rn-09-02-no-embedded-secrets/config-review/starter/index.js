// index.js: prints your review and what would ship inside the app package. Do not edit.
import { labConfig } from './labConfig.js';
import { review } from './review.js';

for (const name of Object.keys(labConfig)) {
  const entry = review[name];
  console.log(entry ? `${name}: ${entry.kind || '?'} → ${entry.livesIn || '?'}` : `${name}: not reviewed`);
}

// Only values reviewed as app config go into the build; everything else must not.
const shipped = Object.entries(review)
  .filter(([, entry]) => entry?.livesIn === 'app-config')
  .map(([name]) => labConfig[name]?.value)
  .filter((value) => value !== null && value !== undefined);
console.log('the package would contain:', JSON.stringify(shipped));
