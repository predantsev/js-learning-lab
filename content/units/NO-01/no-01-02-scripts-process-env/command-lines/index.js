// Runs the planner summary with three command lines, the way a terminal would pass them.
import { runSummary } from './summary.js';

// What the platform itself passed to this process: no arguments of yours.
console.log('process.argv.slice(2):', process.argv.slice(2));

// An environment variable is always text: Node stores the number 3000 as "3000".
process.env.PORT = 3000;
console.log('typeof process.env.PORT:', typeof process.env.PORT);

const commandLines = [
  { argv: ['--limit', '2'], env: { LOCALE: 'uk' } },
  { argv: [], env: { LOCALE: 'en' } },
  { argv: ['--limit', 'two'], env: {} },
];
for (const { argv, env } of commandLines) runSummary(argv, env);

console.log('%%checkedAll%%');
