// A small test runner for this course, now with helpers for React. Read it if you like; you do not
// change it. Real tools (Vitest with Testing Library) look almost the same: render(<App />),
// screen.findByText(...), user.click(...). A failed expectation throws an error, and the test fails.
import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

const WORDS = {
  expected: "%%rExpected%%",
  got: "%%rGot%%",
  notFound: "%%rNotFound%%",
  stillMissing: "%%rStillMissing%%",
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

function equal(a, b) {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => equal(item, b[index]));
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));
  }
  return false;
}

function show(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(show).join(", ")}]`;
  if (value instanceof Element) return `<${value.tagName.toLowerCase()}>`;
  return String(value);
}

export function expect(actual, message = "") {
  const fail = (text) => {
    throw new AssertionError(message ? `${message}: ${text}` : text);
  };
  return {
    toBe(expected) {
      if (!Object.is(actual, expected)) fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);
    },
    toEqual(expected) {
      if (!equal(actual, expected)) fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);
    },
    // An array that has the item, or a text that has the piece.
    toContain(expected) {
      if (!actual?.includes?.(expected)) fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);
    },
  };
}

// ---------- React helpers ----------

const mounted = [];
const replacements = new Map();

// Shows a React element in a fresh container on the page, like the app's main.jsx does,
// and returns once React has put it on the page (flushSync does not wait for later updates).
export function render(element) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const type = replacements.get(element.type) ?? element.type;
  flushSync(() => root.render(createElement(type, element.props)));
  mounted.push({ root, container });
  return { container };
}

function cleanup() {
  for (const { root, container } of mounted.splice(0)) {
    root.unmount();
    container.remove();
  }
}

const textOf = (node) => node.textContent.replace(/\s+/g, " ").trim();
const area = () => mounted.at(-1)?.container ?? document.body;

const ROLES = { BUTTON: "button", UL: "list", OL: "list", LI: "listitem", TEXTAREA: "textbox", FORM: "form" };
function roleOf(node) {
  if (node.getAttribute("role")) return node.getAttribute("role");
  if (/^H[1-6]$/.test(node.tagName)) return "heading";
  if (node.tagName === "INPUT") return node.type === "checkbox" ? "checkbox" : node.type === "submit" ? "button" : "textbox";
  return ROLES[node.tagName] ?? null;
}
function nameOf(node) {
  if (node.getAttribute("aria-label")) return node.getAttribute("aria-label").trim();
  if (node.labels?.length) return textOf(node.labels[0]);
  return textOf(node);
}

// The deepest element whose whole text is exactly `text`.
function findText(text) {
  return [...area().querySelectorAll("*")].find((node) => textOf(node) === text && ![...node.children].some((child) => textOf(child) === text)) ?? null;
}
function findRole(role, name) {
  return [...area().querySelectorAll("*")].filter((node) => roleOf(node) === role && (name === undefined || nameOf(node) === name));
}
function required(found, what) {
  if (!found) throw new AssertionError(`${WORDS.notFound} ${what}`);
  return found;
}

let defaultTimeoutMs = 2000;

export async function waitFor(check, { timeout = defaultTimeoutMs } = {}) {
  const started = Date.now();
  for (;;) {
    try {
      const value = check();
      if (value) return value;
    } catch (error) {
      if (Date.now() - started > timeout) throw error;
    }
    if (Date.now() - started > timeout) throw new AssertionError(`${WORDS.stillMissing} (${timeout} ms)`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

export const screen = {
  // query… — what is on the screen now, or null / [].
  queryByText: (text) => findText(text),
  queryByRole: (role, { name } = {}) => findRole(role, name)[0] ?? null,
  queryAllByRole: (role, { name } = {}) => findRole(role, name),
  // get… — what is on the screen now; a test fails if it is not there.
  getByText: (text) => required(findText(text), JSON.stringify(text)),
  getByRole: (role, { name } = {}) => required(findRole(role, name)[0], `role="${role}"${name ? ` "${name}"` : ""}`),
  getByLabelText: (text) => required([...area().querySelectorAll("label")].find((label) => textOf(label) === text)?.control, `label ${JSON.stringify(text)}`),
  // find… — waits until it appears (2 s at most); use it after anything asynchronous.
  findByText: (text, options) => waitFor(() => screen.getByText(text), options),
  findByRole: (role, query, options) => waitFor(() => screen.getByRole(role, query), options),
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const setValue = (input, value) => Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);

// Acts like a person: one click, or typing text letter by letter into a field.
export const user = {
  async click(element) {
    element.click();
    await settle();
  },
  async type(input, text) {
    input.focus();
    for (const letter of String(text)) {
      setValue(input, input.value + letter);
      input.dispatchEvent(new InputEvent("input", { bubbles: true, data: letter }));
    }
    await settle();
  },
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs every registered test, one after another, and prints one line per test.
// `bail: true` stops at the first failing test.
export async function run({ print = true, beforeEach, bail = false } = {}) {
  const results = [];
  for (const { name, fn } of registered) {
    try {
      await beforeEach?.();
      await fn();
      results.push({ name, passed: true });
    } catch (error) {
      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      results.push({ name, passed: false, message: text });
    } finally {
      cleanup();
    }
    if (bail && !results.at(-1).passed) break;
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

// For the course checks only: run your tests against another version of a component.
export function replaceComponent(original, replacement) {
  replacements.set(original, replacement);
}

export function restoreComponents() {
  replacements.clear();
}

// For the course checks only: how long find… and waitFor wait when no timeout is given.
export function setDefaultTimeout(ms) {
  defaultTimeoutMs = ms;
}
