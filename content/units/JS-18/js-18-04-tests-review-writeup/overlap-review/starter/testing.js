// A small test runner written for this course. Read it if you like; you do not change it.
// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,
// expect(actual).toBe(expected) compares, and a failed comparison throws an error.
const WORDS = {
  expected: "%%rExpected%%",
  got: "%%rGot%%",
  sameFields: "%%rSameFields%%",
  needsFunction: "%%rNeedsFunction%%",
  didNotThrow: "%%rDidNotThrow%%",
  otherError: "%%rOtherError%%",
  summary: "%%rSummary%%",
  noTests: "%%rNoTests%%",
};

const registered = [];

export function test(name, fn) {
  registered.push({ name, fn });
}

class AssertionError extends Error {
  name = "AssertionError";
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Same content: arrays item by item, in order; objects key by key, in any key order.
function equal(a, b) {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => equal(item, b[index]));
  }
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));
  }
  return false;
}

function show(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "function") return `[function ${value.name || "anonymous"}]`;
  if (Array.isArray(value)) return `[${value.map(show).join(", ")}]`;
  if (isObject(value)) {
    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);
    return entries.length === 0 ? "{}" : `{ ${entries.join(", ")} }`;
  }
  return String(value);
}

export function expect(actual, message = "") {
  const fail = (text) => {
    throw new AssertionError(message ? `${message}: ${text}` : text);
  };
  return {
    // Identity: the same primitive value, or the very same object.
    toBe(expected) {
      if (Object.is(actual, expected)) return;
      const hint = typeof actual === "object" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : "";
      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);
    },
    // Same content, even if these are two different objects or arrays.
    toEqual(expected) {
      if (equal(actual, expected)) return;
      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);
    },
    // `actual` must be a function; it is called here and must throw.
    toThrow(ErrorType) {
      if (typeof actual !== "function") fail(WORDS.needsFunction);
      try {
        actual();
      } catch (error) {
        if (ErrorType === undefined || error instanceof ErrorType) return;
        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);
      }
      fail(WORDS.didNotThrow);
    },
  };
}

// Forgets every registered test, so the same tests can be registered again for another module.
export function reset() {
  registered.length = 0;
}

// Runs every registered test, one after another, and prints one line per test.
export async function run({ print = true, reverse = false } = {}) {
  const queue = reverse ? [...registered].reverse() : registered;
  const results = [];
  for (const { name, fn } of queue) {
    try {
      await fn();
      results.push({ name, passed: true });
    } catch (error) {
      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      results.push({ name, passed: false, message: text });
    }
  }
  if (print) {
    if (results.length === 0) console.log(WORDS.noTests);
    for (const result of results) {
      if (result.passed) console.log(`✓ ${result.name}`);
      else console.error(`✗ ${result.name} — ${result.message}`);
    }
    const failed = results.filter((result) => !result.passed).length;
    console.log(WORDS.summary.replace("{passed}", results.length - failed).replace("{failed}", failed));
  }
  return results;
}
