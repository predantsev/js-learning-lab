// Runs the PR's tests and your conflict test against the PR, then prints your review (read-only).
import { run } from './testing.js';
import { comments, decision, runbook } from './review.js';

console.log(`— sync.test.js + conflict.test.js (%%onThePr%%) —`);
await import('./sync.test.js');
await import('./conflict.test.js');
await run();

console.log(`— %%reviewComments%%: ${Array.isArray(comments) ? comments.length : 0} —`);
for (const c of Array.isArray(comments) ? comments : []) console.log(`  ${c?.file}:${c?.line} [${c?.kind}, ${c?.severity}] ${c?.text}`);
console.log(`— %%decisionChoice%%: ${decision?.choice || '—'}`);
console.log(`— %%runbookSteps%%: ${Array.isArray(runbook?.steps) ? runbook.steps.map((s) => s?.kind).join(' → ') : '—'}`);
