// A small test runner with the same shape as node:test (read-only): test(name, async (t) => …)
// and t.after(fn) for teardown. In your own project you import { test } from 'node:test' instead.
const registered = [];

export function test(name, fn) {
  registered.push({ name, fn });
}

const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`the test took longer than ${ms} ms`)), ms).unref()),
]);

// Runs every registered test one after another; t.after callbacks run after each test, even a failed one.
export async function run({ print = true } = {}) {
  const results = [];
  for (const { name, fn } of registered) {
    const cleanups = [];
    let error = null;
    try {
      await withTimeout(Promise.resolve().then(() => fn({ after: (cleanup) => cleanups.push(cleanup) })), 2500);
    } catch (thrown) {
      error = thrown;
    }
    for (const cleanup of cleanups.reverse()) {
      try {
        await cleanup();
      } catch (thrown) {
        error ??= thrown;
      }
    }
    results.push({ name, passed: error === null, message: error === null ? '' : String(error?.message ?? error) });
    if (print) console.log(error === null ? `✔ ${name}` : `✖ ${name}\n    ${String(error?.message ?? error).split('\n')[0]}`);
  }
  if (print) console.log(`ℹ tests ${results.length}, pass ${results.filter((r) => r.passed).length}, fail ${results.filter((r) => !r.passed).length}`);
  return results;
}
