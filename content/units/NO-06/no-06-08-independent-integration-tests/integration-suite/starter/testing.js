// The course's small test runner for Node.js (read-only). You use test, unperformed and expect;
// run-tests.js calls run(). It works the same on the platform and with `node run-tests.js` in a terminal.
const registered = [];

// Registers a test: fn may be async; a test fails when fn throws.
export function test(name, fn) {
  registered.push({ name, fn });
}

// Registers a check that was NOT performed, with the reason. It is reported as "not performed" —
// never as passed. Use it for checks you cannot run here (for example, on a native device).
export function unperformed(name, reason) {
  registered.push({ name, reason: String(reason ?? '') });
}

class AssertionError extends Error {
  name = 'AssertionError';
}
const show = (value) => (typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value) ?? String(value));
function equal(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function expect(actual) {
  const check = (passed, expected) => {
    if (!passed) throw new AssertionError(`expected ${expected}, got ${show(actual)}`);
  };
  return {
    toBe: (expected) => check(Object.is(actual, expected), show(expected)),
    toEqual: (expected) => check(equal(actual, expected), show(expected)),
    toBeTruthy: () => check(Boolean(actual), 'a truthy value'),
    toBeFalsy: () => check(!actual, 'a falsy value'),
    toBeNull: () => check(actual === null, 'null'),
    toContain: (expected) => check(Array.isArray(actual) || typeof actual === 'string' ? actual.includes(expected) : false, `something containing ${show(expected)}`),
    toHaveLength: (expected) => check(actual?.length === expected, `length ${expected}`),
    toBeGreaterThan: (expected) => check(actual > expected, `more than ${expected}`),
  };
}

// Runs every registered test one after another. Returns [{ name, status, message }], where status is
// 'passed', 'failed' or 'unperformed'; with print it also prints one line per test and a summary.
export async function run({ print = true } = {}) {
  const results = [];
  for (const entry of registered) {
    if (!('fn' in entry)) {
      results.push({ name: entry.name, status: 'unperformed', message: entry.reason });
      continue;
    }
    try {
      await entry.fn();
      results.push({ name: entry.name, status: 'passed', message: '' });
    } catch (error) {
      results.push({ name: entry.name, status: 'failed', message: `${error.name}: ${error.message}` });
    }
  }
  if (print) {
    for (const result of results) {
      if (result.status === 'passed') console.log(`✓ ${result.name}`);
      else if (result.status === 'failed') console.log(`✗ ${result.name} — ${result.message}`);
      else console.log(`○ ${result.name} — %%notPerformed%%: ${result.message}`);
    }
    const count = (status) => results.filter((result) => result.status === status).length;
    console.log(`%%summaryPassed%% ${count('passed')}, %%summaryFailed%% ${count('failed')}, %%summaryUnperformed%% ${count('unperformed')}`);
  }
  return results;
}
