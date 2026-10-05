// Checks of capstone step JS-09, planner variant: the learner's tests in tests/domain.test.js
// pass with the correct domain/tasks.js and fail with versions of it that have one seeded defect each;
// run-tests.js prints the results on the page and sets a failing exit code under Node.js; and the
// tests need no page, so they also run where there is no `document` (as under Node.js).
//
// The learner's suite is run again with swapped modules: every relative import of the project is
// loaded from a copy, where domain/tasks.js is the correct or a broken version and tests/testing.js is
// the course runner as the step gives it (so a changed runner cannot hide a failure). While the
// suite runs, every global of this check harness is hidden.
const DOMAIN = 'domain/tasks.js';
const SUITE = 'tests/domain.test.js';
const RUNNER = 'tests/testing.js';
const DRIVER = 'run-tests.js';
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'logs', 'spy', 'mockFetch', 'storage', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The rules of a task: pure functions. No page and no storage here; the starting tasks are in\n// data/tasks.json.\n\n// The word for a priority value.\nexport function priorityText(priority) {\n  switch (priority) {\n    case \"low\":\n      return \"%%priorityLow%%\";\n    case \"normal\":\n      return \"%%priorityNormal%%\";\n    case \"high\":\n      return \"%%priorityHigh%%\";\n    default:\n      return \"\";\n  }\n}\n\n// The label of a task: the title, the due date (or a fallback text) in brackets and the priority in words.\nexport function formatTaskLabel(task) {\n  return task.title + \" (\" + (task.dueDate ?? \"%%noDueDate%%\") + \") · \" + priorityText(task.priority);\n}\n\n// Checks a draft task. Returns { ok: true, value } with the cleaned data,\n// or { ok: false, errors } with an error key for every field that has a problem.\nexport function validateTask(input) {\n  const errors = {};\n\n  const title = (input.title ?? \"\").trim();\n  if (title === \"\") {\n    errors.title = \"required\";\n  } else if (title.length > 80) {\n    errors.title = \"too-long\";\n  }\n\n  // The three known priorities share one break; a missing priority is \"normal\".\n  const priority = input.priority ?? \"normal\";\n  switch (priority) {\n    case \"low\":\n    case \"normal\":\n    case \"high\":\n      break;\n    default:\n      errors.priority = \"unknown\";\n  }\n\n  if (errors.title !== undefined || errors.priority !== undefined) {\n    return { ok: false, errors: errors };\n  }\n  return { ok: true, value: { title: title, dueDate: input.dueDate ?? null, priority: priority } };\n}\n\n// A new list with a new task at the end, if the draft passes the check; otherwise the same list.\n// The draft may also carry the done flag.\nexport function addTask(list, id, input) {\n  const check = validateTask(input);\n  if (!check.ok) {\n    return list;\n  }\n  const task = { id: id, title: check.value.title, dueDate: check.value.dueDate, done: input.done === true, priority: check.value.priority };\n  return [...list, task];\n}\n\n// A new list in which the task with this id is replaced by a copy with the changes;\n// the other tasks are the same objects.\nexport function updateTask(list, id, changes) {\n  const result = [];\n  for (const task of list) {\n    if (task.id === id) {\n      result.push({ ...task, ...changes });\n    } else {\n      result.push(task);\n    }\n  }\n  return result;\n}\n\n// A new list without the task with this id.\nexport function removeTask(list, id) {\n  const result = [];\n  for (const task of list) {\n    if (task.id !== id) {\n      result.push(task);\n    }\n  }\n  return result;\n}\n\n// The tasks whose title contains the query, ignoring upper and lower case and the spaces\n// at the edges of the query. An empty query keeps every task.\nexport function searchTasks(list, query) {\n  const text = query.trim().toLowerCase();\n  return list.filter((task) => task.title.toLowerCase().includes(text));\n}\n\n// The pending (\"pending\") or the done (\"done\") tasks.\nexport function filterTasks(list, status) {\n  const done = status === \"done\";\n  return list.filter((task) => task.done === done);\n}\n\n// The place of a priority in the order: high first, then normal, then low.\nfunction priorityRank(priority) {\n  switch (priority) {\n    case \"high\":\n      return 0;\n    case \"normal\":\n      return 1;\n    default:\n      return 2;\n  }\n}\n\n// Comparator: earlier due dates first, tasks without a due date after all dated ones;\n// the same due date is ordered by priority. Equal tasks return 0 and keep their order.\nfunction byDueDateThenPriority(a, b) {\n  if (a.dueDate !== b.dueDate) {\n    if (a.dueDate === null) {\n      return 1;\n    }\n    if (b.dueDate === null) {\n      return -1;\n    }\n    return a.dueDate.localeCompare(b.dueDate);\n  }\n  return priorityRank(a.priority) - priorityRank(b.priority);\n}\n\n// A sorted copy; the received list keeps its order.\nexport function sortTasks(list) {\n  return list.toSorted(byDueDateThenPriority);\n}\n\n// How many pending tasks are due on or before the day; a task without a due date is never due.\n// Dates are \"YYYY-MM-DD\" text, so comparing the text compares the dates.\nexport function countDueTasks(list, day) {\n  return list.filter((task) => !task.done && task.dueDate !== null && task.dueDate.localeCompare(day) <= 0).length;\n}");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
/** The correct domain module with one piece of code replaced. */
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${DOMAIN} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  nameLimitAt80: broken("} else if (title.length > 80) {", "} else if (title.length >= 80) {"),
  nameLimitAt82: broken("} else if (title.length > 80) {", "} else if (title.length > 81) {"),
  unknownPriorityAccepted: broken("    default:\n      errors.priority = \"unknown\";", "    default:\n      break;"),
  dueTodayMissed: broken(".localeCompare(day) <= 0).length", ".localeCompare(day) < 0).length"),
  doneCounted: broken("  return list.filter((task) => !task.done && task.dueDate !== null", "  return list.filter((task) => task.dueDate !== null"),
  laterCounted: broken(".localeCompare(day) <= 0).length", ".localeCompare(day) >= 0).length"),
  filterIgnoresStatus: broken("  return list.filter((task) => task.done === done);", "  return [...list];"),
  noDueDateFirst: broken("    if (a.dueDate === null) {\n      return 1;\n    }\n    if (b.dueDate === null) {\n      return -1;\n    }", "    if (a.dueDate === null) {\n      return -1;\n    }\n    if (b.dueDate === null) {\n      return 1;\n    }"),
  laterFirst: broken("    return a.dueDate.localeCompare(b.dueDate);", "    return b.dueDate.localeCompare(a.dueDate);"),
  doneGivesPending: broken("  const done = status === \"done\";", "  const done = false;"),
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
/** Runs the suite with `domain` as domain/tasks.js: `{ results }`, or `{ error }` when it could not run. */
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

test('your tests catch a title limit that already rejects 80 characters', async () => {
  await expectCatches(BROKEN.nameLimitAt80, "has a title limit that already rejects 80 characters");
});

test('your tests catch a title limit that still accepts 81 characters', async () => {
  await expectCatches(BROKEN.nameLimitAt82, "has a title limit that still accepts 81 characters");
});

test('your tests catch an unknown priority accepted', async () => {
  await expectCatches(BROKEN.unknownPriorityAccepted, "has an unknown priority accepted");
});

test('your tests catch a due count that misses tasks due on the day itself', async () => {
  await expectCatches(BROKEN.dueTodayMissed, "has a due count that misses tasks due on the day itself");
});

test('your tests catch done tasks counted as due', async () => {
  await expectCatches(BROKEN.doneCounted, "has done tasks counted as due");
});

test('your tests catch a due count that counts later tasks instead of earlier ones', async () => {
  await expectCatches(BROKEN.laterCounted, "has a due count that counts later tasks instead of earlier ones");
});

test('your tests catch a filter that ignores the status', async () => {
  await expectCatches(BROKEN.filterIgnoresStatus, "has a filter that ignores the status");
});

test('your tests catch a sort that puts tasks without a due date first', async () => {
  await expectCatches(BROKEN.noDueDateFirst, "has a sort that puts tasks without a due date first");
});

test('your tests catch a sort that puts later due dates first', async () => {
  await expectCatches(BROKEN.laterFirst, "has a sort that puts later due dates first");
});

test('your tests catch a filter whose done status keeps the pending tasks', async () => {
  await expectCatches(BROKEN.doneGivesPending, "has a filter whose \"done\" keeps the pending tasks");
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
