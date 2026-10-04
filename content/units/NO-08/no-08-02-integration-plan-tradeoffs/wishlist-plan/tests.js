// Checks the plan as data: completeness, known words, and that each check can prove its requirement.
import { decision, plan, runbook } from './plan.js';
import { ACTIONS, COMPONENTS, REQUIREMENTS } from './requirements.js';

const rowFor = (id) => plan.filter((row) => row.requirement === id);
const after = (steps, first, then) => {
  const i = steps.indexOf(first);
  return i !== -1 && steps.indexOf(then, i + 1) !== -1;
};

test('every requirement has exactly one row', () => {
  expect(Array.isArray(plan), 'plan is an array').toBe(true);
  for (const { id } of REQUIREMENTS) expect(rowFor(id).length, `rows for "${id}"`).toBe(1);
  expect(plan.length, 'rows in the plan').toBe(REQUIREMENTS.length);
});

test('every row names a known component', () => {
  for (const row of plan) expect(COMPONENTS.includes(row.component), `component "${row.component}" of "${row.requirement}" is in COMPONENTS`).toBe(true);
});

test('every row has steps from the list and evidence', () => {
  for (const row of plan) {
    expect(Array.isArray(row.steps) && row.steps.length > 0, `"${row.requirement}" has steps`).toBe(true);
    for (const step of row.steps) expect(Object.hasOwn(ACTIONS, step), `step "${step}" of "${row.requirement}" is in ACTIONS`).toBe(true);
    expect(typeof row.evidence === 'string' && row.evidence.trim() !== '', `"${row.requirement}" names its evidence`).toBe(true);
  }
});

test('the restart check stops and starts the server, then sends a request', () => {
  const [row] = rowFor('restart');
  expect(row, 'the restart row').toBeDefined();
  const steps = row.steps ?? [];
  expect(after(steps, 'stop-server', 'start-server'), `"start-server" comes after "stop-server" in ${JSON.stringify(steps)}`).toBe(true);
  expect(after(steps, 'start-server', 'request'), `"request" comes after "start-server" in ${JSON.stringify(steps)}`).toBe(true);
});

test('the client check reloads the page after a request', () => {
  const [row] = rowFor('client');
  expect(row, 'the client row').toBeDefined();
  const steps = row.steps ?? [];
  expect(after(steps, 'request', 'reload-page'), `"reload-page" comes after "request" in ${JSON.stringify(steps)}`).toBe(true);
});

test('each option names its failure mode and whether it loses acknowledged writes', () => {
  const byId = Object.fromEntries(decision.options.map((option) => [option.id, option]));
  for (const option of decision.options) {
    expect(typeof option.failureMode === 'string' && option.failureMode.trim() !== '', `failureMode of "${option.id}"`).toBe(true);
  }
  expect(byId['write-through']?.losesAcknowledgedWrites, 'losesAcknowledgedWrites of "write-through"').toBe(false);
  expect(byId['cache-flush']?.losesAcknowledgedWrites, 'losesAcknowledgedWrites of "cache-flush"').toBe(true);
});

test('the choice keeps every acknowledged write', () => {
  const chosen = decision.options.find((option) => option.id === decision.choice);
  expect(chosen, `an option with the id "${decision.choice}"`).toBeDefined();
  expect(chosen.losesAcknowledgedWrites, `losesAcknowledgedWrites of the chosen "${decision.choice}"`).toBe(false);
});

test('the runbook note starts by looking, not by changing anything', () => {
  const steps = runbook?.steps ?? [];
  expect(steps.length > 0, 'the runbook note has steps').toBe(true);
  expect(['request', 'read-log'].includes(steps[0]), `the first step "${steps[0]}" is "request" or "read-log"`).toBe(true);
  for (const step of steps) expect(Object.hasOwn(ACTIONS, step), `runbook step "${step}" is in ACTIONS`).toBe(true);
});
