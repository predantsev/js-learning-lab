// Runs the planner summary with three command lines, the way a terminal would pass them.
import { runSummary } from './summary.js';

// What the platform itself passed to this process: no arguments of yours.
console.log('process.argv.slice(2):', process.argv.slice(2));

// Every environment variable is text: not one value in process.env is a number.
const allText = Object.values(process.env).every((value) => typeof value === 'string');
console.log('every process.env value is a string:', allText);

const commandLines = [
  { argv: ['--limit', '2'], env: { LOCALE: 'uk' } },
  { argv: [], env: { LOCALE: 'en' } },
  { argv: ['--limit', 'two'], env: {} },
];
for (const { argv, env } of commandLines) runSummary(argv, env);

console.log('%%checkedAll%%');
