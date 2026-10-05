// Checks of capstone step JS-09, habits variant: the learner's tests in tests/domain.test.js
// pass with the correct domain/habits.js and fail with versions of it that have one seeded defect each;
// run-tests.js prints the results on the page and sets a failing exit code under Node.js; and the
// tests need no page, so they also run where there is no `document` (as under Node.js).
//
// The learner's suite is run again with swapped modules: every relative import of the project is
// loaded from a copy, where domain/habits.js is the correct or a broken version and tests/testing.js is
// the course runner as the step gives it (so a changed runner cannot hide a failure). While the
// suite runs, every global of this check harness is hidden.
const DOMAIN = 'domain/habits.js';
const SUITE = 'tests/domain.test.js';
const RUNNER = 'tests/testing.js';
const DRIVER = 'run-tests.js';
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'logs', 'spy', 'mockFetch', 'storage', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The rules of a habit: pure functions. No page and no storage here; the starting habits are in\n// data/habits.json.\n\n// The word for a frequency value.\nexport function frequencyText(frequency) {\n  switch (frequency) {\n    case \"daily\":\n      return \"%%daily%%\";\n    case \"weekly\":\n      return \"%%weekly%%\";\n    default:\n      return \"\";\n  }\n}\n\n// The label of a habit: the name, the frequency in words, and a mark when the habit is paused.\nexport function formatHabitLabel(habit) {\n  const label = habit.name + \" · \" + frequencyText(habit.frequency);\n  if (habit.active === false) {\n    return label + \" · %%pausedMark%%\";\n  }\n  return label;\n}\n\n// Checks a draft habit. Returns { ok: true, value } with the cleaned data,\n// or { ok: false, errors } with an error key for every field that has a problem.\nexport function validateHabit(input) {\n  const errors = {};\n\n  const name = (input.name ?? \"\").trim();\n  if (name === \"\") {\n    errors.name = \"required\";\n  } else if (name.length > 80) {\n    errors.name = \"too-long\";\n  }\n\n  // The two known frequencies share one break; a missing frequency is \"daily\".\n  const frequency = input.frequency ?? \"daily\";\n  switch (frequency) {\n    case \"daily\":\n    case \"weekly\":\n      break;\n    default:\n      errors.frequency = \"unknown\";\n  }\n\n  if (errors.name !== undefined || errors.frequency !== undefined) {\n    return { ok: false, errors: errors };\n  }\n  return { ok: true, value: { name: name, frequency: frequency } };\n}\n\n// A new list with a new habit at the end, if the draft passes the check; otherwise the same list.\n// Every new habit gets its own, new completions array; the draft may also carry the active flag.\nexport function addHabit(list, id, input) {\n  const check = validateHabit(input);\n  if (!check.ok) {\n    return list;\n  }\n  const habit = { id: id, name: check.value.name, frequency: check.value.frequency, active: input.active ?? true, completions: [] };\n  return [...list, habit];\n}\n\n// A new list in which the habit with this id is replaced by a copy with the changes;\n// the other habits are the same objects.\nexport function updateHabit(list, id, changes) {\n  const result = [];\n  for (const habit of list) {\n    if (habit.id === id) {\n      result.push({ ...habit, ...changes });\n    } else {\n      result.push(habit);\n    }\n  }\n  return result;\n}\n\n// A new list without the habit with this id.\nexport function removeHabit(list, id) {\n  const result = [];\n  for (const habit of list) {\n    if (habit.id !== id) {\n      result.push(habit);\n    }\n  }\n  return result;\n}\n\n// A new list in which the habit with this id has the day in a NEW completions array.\n// Assumption: the day is today, never earlier than the stored dates, so adding it\n// at the end keeps the dates in ascending order. A day that is already there is not added again.\nexport function completeHabit(list, id, day) {\n  const result = [];\n  for (const habit of list) {\n    if (habit.id !== id) {\n      result.push(habit);\n      continue;\n    }\n    let alreadyDone = false;\n    for (const date of habit.completions) {\n      if (date === day) {\n        alreadyDone = true;\n        break;\n      }\n    }\n    if (alreadyDone) {\n      result.push(habit);\n    } else {\n      result.push({ ...habit, completions: [...habit.completions, day] });\n    }\n  }\n  return result;\n}\n\n// The habits whose name contains the query, ignoring upper and lower case and the spaces\n// at the edges of the query. An empty query keeps every habit.\nexport function searchHabits(list, query) {\n  const text = query.trim().toLowerCase();\n  return list.filter((habit) => habit.name.toLowerCase().includes(text));\n}\n\n// The active (\"active\") or the paused (\"paused\") habits.\nexport function filterHabits(list, status) {\n  const active = status === \"active\";\n  return list.filter((habit) => habit.active === active);\n}\n\n// Comparator: alphabetical order of the names; equal names return 0 and keep their order.\nfunction byName(a, b) {\n  return a.name.localeCompare(b.name);\n}\n\n// A sorted copy; the received list keeps its order.\nexport function sortHabitsByName(list) {\n  return list.toSorted(byName);\n}\n\n// On how many of the given days the habit was completed, and which share of the days that is.\n// No days means no share: the rate is 0, not NaN.\nexport function summarizeHabit(habit, days) {\n  const count = days.filter((day) => habit.completions.includes(day)).length;\n  return { count: count, rate: days.length === 0 ? 0 : count / days.length };\n}\n\n// The names of the habits of a list, each with its completion rate over the days in percent.\nexport function formatRates(list, days) {\n  let text = \"\";\n  for (const habit of list) {\n    if (text !== \"\") {\n      text = text + \"; \";\n    }\n    text = text + habit.name + \" — \" + summarizeHabit(habit, days).rate * 100 + \"%\";\n  }\n  return text;\n}");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
/** The correct domain module with one piece of code replaced. */
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${DOMAIN} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  nameLimitAt80: broken("} else if (name.length > 80) {", "} else if (name.length >= 80) {"),
  nameLimitAt82: broken("} else if (name.length > 80) {", "} else if (name.length > 81) {"),
  unknownFrequencyAccepted: broken("    default:\n      errors.frequency = \"unknown\";", "    default:\n      break;"),
  daysOutsideCounted: broken("  const count = days.filter((day) => habit.completions.includes(day)).length;", "  const count = habit.completions.length;"),
  noDaysNaN: broken("  return { count: count, rate: days.length === 0 ? 0 : count / days.length };", "  return { count: count, rate: count / days.length };"),
  rateInPercent: broken("  return { count: count, rate: days.length === 0 ? 0 : count / days.length };", "  return { count: count, rate: days.length === 0 ? 0 : (count / days.length) * 100 };"),
  filterIgnoresStatus: broken("  return list.filter((habit) => habit.active === active);", "  return [...list];"),
  reversedSort: broken("  return a.name.localeCompare(b.name);", "  return b.name.localeCompare(a.name);"),
  pausedGivesActive: broken("  const active = status === \"active\";", "  const active = true;"),
};

// ---------- running the learner's suite with swapped modules ----------

const blobUrl = (code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
/** The project path that a relative import `spec` in the file `from` points to. */
function resolvePath(from, spec) {
  const parts = from.split('/').slice(0, -1);
  for (const segment of spec.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') parts.pop();
    else parts.push(segment);
  }
  return parts.join('/');
}
const IMPORT = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.{1,2}\/[^"']*)\2/g;
/**
 * Blob URLs for `path` and every project module it imports, with the relative imports rewritten to
 * those URLs. `given` maps a project path to the code used instead of the project file.
 */
function moduleUrls(path, given, urls = {}) {
  if (urls[path] !== undefined) return urls;
  const code = given[path] ?? files[path];
  if (typeof code !== 'string') throw new Error(`there is no file ${path}`);
  urls[path] = null; // being built: a cycle keeps the project path
  for (const match of code.matchAll(IMPORT)) {
    const target = resolvePath(path, match[3]);
    if (/\.m?js$/.test(target) && (given[target] !== undefined || typeof files[target] === 'string')) moduleUrls(target, given, urls);
  }
  urls[path] = blobUrl(code.replace(IMPORT, (all, before, quote, spec) => {
    const target = resolvePath(path, spec);
    return before + JSON.stringify(urls[target] ?? `~/${target}`);
  }));
  return urls;
}
/** Runs `use()` with every harness global removed from `window`, then puts them back. */
async function withoutHarness(use) {
  const saved = HARNESS.map((name) => [name, Object.getOwnPropertyDescriptor(window, name)]);
  for (const name of HARNESS) delete window[name];
  try {
    return await use();
  } finally {
    for (const [name, descriptor] of saved) if (descriptor) Object.defineProperty(window, name, descriptor);
  }
}
/** Runs the suite with `domain` as domain/habits.js: `{ results }`, or `{ error }` when it could not run. */
async function runSuite(domain) {
  try {
    const urls = moduleUrls(SUITE, { [DOMAIN]: domain, [RUNNER]: TESTING });
    return await withoutHarness(async () => {
      await import(urls[SUITE]);
      const runner = await import(urls[RUNNER]);
      return { results: await runner.run({ print: false }) };
    });
  } catch (error) {
    return { error: `${error?.name}: ${error?.message}` };
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
/** The precondition of every "catches" check: the suite runs, has tests, and all pass with the correct module. */
async function expectPassesOnCorrect() {
  const run = await runSuite(CORRECT);
  expect(run.error ?? null, `an error while ${SUITE} ran with the correct ${DOMAIN}`).toBeNull();
  expect(run.results.length, `the number of tests in ${SUITE}`).toBeGreaterThan(0);
  expect(failing(run.results), `your tests that fail with the correct ${DOMAIN}`).toEqual([]);
}
async function expectCatches(domain, defect) {
  await expectPassesOnCorrect();
  const run = await runSuite(domain);
  const caught = run.error !== undefined || run.results.some((result) => !result.passed);
  expect(caught, `a failing test of yours when ${DOMAIN} ${defect}`).toBe(true);
}

// ---------- checks ----------

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('the tests pass with the correct domain module', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch a name limit that already rejects 80 characters', async () => {
  await expectCatches(BROKEN.nameLimitAt80, "has a name limit that already rejects 80 characters");
});

test('your tests catch a name limit that still accepts 81 characters', async () => {
  await expectCatches(BROKEN.nameLimitAt82, "has a name limit that still accepts 81 characters");
});

test('your tests catch an unknown frequency accepted', async () => {
  await expectCatches(BROKEN.unknownFrequencyAccepted, "has an unknown frequency accepted");
});

test('your tests catch completions outside the given days counted', async () => {
  await expectCatches(BROKEN.daysOutsideCounted, "has completions outside the given days counted");
});

test('your tests catch a rate of NaN when there are no days', async () => {
  await expectCatches(BROKEN.noDaysNaN, "has a rate of NaN when there are no days");
});

test('your tests catch a rate in percent instead of a share', async () => {
  await expectCatches(BROKEN.rateInPercent, "has a rate in percent instead of a share");
});

test('your tests catch a filter that ignores the status', async () => {
  await expectCatches(BROKEN.filterIgnoresStatus, "has a filter that ignores the status");
});

test('your tests catch a sort in reverse alphabetical order', async () => {
  await expectCatches(BROKEN.reversedSort, "has a sort in reverse alphabetical order");
});

test('your tests catch a filter whose paused status keeps the active habits', async () => {
  await expectCatches(BROKEN.pausedGivesActive, "has a filter whose \"paused\" keeps the active habits");
});

test('the tests need no page', async () => {
  await expectPassesOnCorrect();
  let urls;
  try {
    urls = moduleUrls(SUITE, { [DOMAIN]: CORRECT, [RUNNER]: TESTING });
  } catch (error) {
    urls = null;
  }
  expect(urls !== null, `the modules of ${SUITE}`).toBe(true);
  // A worker has no `document`, no `window` and no `localStorage`, like Node.js. (The sandbox
  // refuses module workers, so a classic worker loads the modules with import().)
  const code = `import(${JSON.stringify(urls[SUITE])})
  .then(() => import(${JSON.stringify(urls[RUNNER])}))
  .then((runner) => runner.run({ print: false }))
  .then((results) => postMessage({ results: JSON.parse(JSON.stringify(results)) }), (error) => postMessage({ error: String(error && error.name) + ': ' + String(error && error.message) }));`;
  const outcome = await new Promise((resolve) => {
    const worker = new Worker(blobUrl(code));
    const timer = setTimeout(() => { worker.terminate(); resolve({ error: 'no answer within 3 s' }); }, 3000);
    worker.onmessage = (event) => { clearTimeout(timer); worker.terminate(); resolve(event.data); };
    worker.onerror = (event) => { clearTimeout(timer); worker.terminate(); event.preventDefault(); resolve({ error: event.message || 'the tests could not run without a page' }); };
  });
  expect(outcome.error ?? null, `an error while ${SUITE} ran without a page`).toBeNull();
  expect(failing(outcome.results), 'your tests that fail without a page').toEqual([]);
});

test('tests/testing.js reports a failed expectation', async () => {
  let runner = null;
  let problem = null;
  try {
    // A fresh copy of the project's runner, so the learner's own tests are not registered in it.
    runner = await import(moduleUrls(RUNNER, {})[RUNNER]);
  } catch (error) {
    problem = `${error?.name}: ${error?.message}`;
  }
  expect(problem, `an error while loading ${RUNNER}`).toBeNull();
  for (const name of ['test', 'expect', 'run']) expect(typeof runner[name], `the named export ${name} of ${RUNNER}`).toBe('function');
  const register = runner.test; // (a plain call: these are tests of the runner, not checks of this step)
  register('fails', () => runner.expect(1 + 1).toBe(3));
  register('passes', () => runner.expect([1, 2]).toEqual([1, 2]));
  const results = await runner.run({ print: false });
  expect(results.map((result) => result.passed), `the results of ${RUNNER} for a failing and a passing test`).toEqual([false, true]);
});

test('run-tests.js prints the results on the page', () => {
  const pattern = new RegExp(`^${L.rSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{passed\\}', '(\\d+)').replace('\\{failed\\}', '(\\d+)')}$`);
  const summary = logs().map((line) => pattern.exec(line.trim())).find((match) => match !== null) ?? null;
  expect(summary !== null, `a line "${L.rSummary}" in the console after the page started`).toBe(true);
  expect(Number(summary[1]), 'the number of passed tests in that line').toBeGreaterThan(0);
  expect(Number(summary[2]), 'the number of failed tests in that line').toBe(0);
});

test('run-tests.js sets exit code 1 under Node when a test fails', async () => {
  await expectPassesOnCorrect();
  // A broken version that one of the learner's tests catches, so that a test really fails.
  let caughtBy = null;
  for (const domain of Object.values(BROKEN)) {
    const run = await runSuite(domain);
    if (run.results !== undefined && run.results.some((result) => !result.passed)) {
      caughtBy = domain;
      break;
    }
  }
  expect(caughtBy !== null, `a broken ${DOMAIN} that makes one of your tests fail`).toBe(true);
  const exitCodes = [];
  for (const domain of [CORRECT, caughtBy]) {
    let urls;
    try {
      urls = moduleUrls(DRIVER, { [DOMAIN]: domain, [RUNNER]: TESTING });
    } catch (error) {
      urls = null;
    }
    expect(urls !== null, `the file ${DRIVER}`).toBe(true);
    // A stand-in for Node's `process`: only `exitCode` matters here.
    const fakeProcess = { exitCode: undefined, env: {}, argv: [] };
    const result = await withoutHarness(async () => {
      Object.defineProperty(window, 'process', { value: fakeProcess, configurable: true, writable: true });
      try {
        await import(urls[DRIVER]);
        return null;
      } catch (error) {
        return `${error?.name}: ${error?.message}`;
      } finally {
        delete window.process;
      }
    });
    expect(result, `an error while ${DRIVER} ran with a \`process\` like the one of Node.js`).toBeNull();
    exitCodes.push(fakeProcess.exitCode ?? 0);
  }
  expect(exitCodes[0], 'process.exitCode when every test passes').not.toBe(1);
  expect(exitCodes[1], 'process.exitCode when a test fails').toBe(1);
});
