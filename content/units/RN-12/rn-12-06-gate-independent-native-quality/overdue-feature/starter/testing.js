// SIMULATION for the preview: a small stand-in for Jest + React Native Testing Library 14.
// It keeps their names (test, expect, render, screen, userEvent, toBeOnTheScreen), so a test
// written here moves to a real project by changing only the import line. It is NOT the real
// tool: it renders through react-native-web in this browser, while the real one renders
// React Native host components in Node.js. You do not change this file.
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
  return value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Element);
}

function equal(a, b) {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => equal(item, b[index]));
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a).filter((key) => a[key] !== undefined);
    const other = Object.keys(b).filter((key) => b[key] !== undefined);
    return keys.length === other.length && keys.every((key) => equal(a[key], b[key]));
  }
  return false;
}

const textOf = (node) => (node?.textContent ?? "").replace(/\s+/g, " ").trim();

function show(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(show).join(", ")}]`;
  if (value instanceof Element) return `<${roleOf(value) ?? "element"} ${JSON.stringify(nameOf(value))}>`;
  if (isObject(value)) return `{ ${Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`).join(", ")} }`;
  return String(value);
}

function makeMatchers(actual, negate) {
  const check = (passed, text) => {
    if (passed === negate) throw new AssertionError(negate ? `not ${text}` : text);
  };
  const versus = (expected) => `${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`;
  return {
    toBe: (expected) => check(Object.is(actual, expected), versus(expected)),
    toEqual: (expected) => check(equal(actual, expected), versus(expected)),
    toContain: (expected) => check(Boolean(actual?.includes?.(expected)), versus(expected)),
    toBeTruthy: () => check(Boolean(actual), versus("truthy")),
    toBeFalsy: () => check(!actual, versus("falsy")),
    toBeNull: () => check(actual === null, versus(null)),
    toBeUndefined: () => check(actual === undefined, versus(undefined)),
    toBeGreaterThan: (expected) => check(actual > expected, versus(`> ${expected}`)),
    toHaveLength: (expected) => check(actual?.length === expected, versus(`length ${expected}`)),
    toBeOnTheScreen: () => check(actual instanceof Element && actual.isConnected, versus("on the screen")),
    toHaveTextContent: (expected) =>
      check(expected instanceof RegExp ? expected.test(textOf(actual)) : textOf(actual) === expected, `${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(textOf(actual))}`),
    toThrow: () => {
      let threw = false;
      try {
        actual();
      } catch {
        threw = true;
      }
      check(threw, versus("an error"));
    },
  };
}

export function expect(actual) {
  return { ...makeMatchers(actual, false), not: makeMatchers(actual, true) };
}

// ---------- rendering ----------

const mounted = [];
const replacements = new Map();

// Shows a React Native element in a fresh container, like the app would, and waits for it.
export async function render(element) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const type = replacements.get(element.type) ?? element.type;
  flushSync(() => root.render(createElement(type, element.props)));
  mounted.push({ root, container });
  await settle();
  return { container };
}

function cleanup() {
  for (const { root, container } of mounted.splice(0)) {
    root.unmount();
    container.remove();
  }
}

const area = () => mounted.at(-1)?.container ?? document.body;
const roleOf = (node) => node.getAttribute("role");
const nameOf = (node) => (node.getAttribute("aria-label") ?? textOf(node)).trim();

// The deepest element whose whole text is exactly `text`.
function findText(text) {
  return [...area().querySelectorAll("*")].filter((node) => textOf(node) === text && ![...node.children].some((child) => textOf(child) === text));
}
const findLabel = (label) => [...area().querySelectorAll("[aria-label]")].filter((node) => node.getAttribute("aria-label").trim() === label);
const findRole = (role, name) => [...area().querySelectorAll("[role]")].filter((node) => roleOf(node) === role && (name === undefined || nameOf(node) === name));

function one(found, what) {
  if (found.length === 0) throw new AssertionError(`${WORDS.notFound} ${what}`);
  return found[0];
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
  // getBy… — on the screen now; the test fails if it is not there.
  getByText: (text) => one(findText(text), JSON.stringify(text)),
  getByLabelText: (label) => one(findLabel(label), `accessibilityLabel ${JSON.stringify(label)}`),
  getByRole: (role, { name } = {}) => one(findRole(role, name), `role "${role}"${name === undefined ? "" : ` ${JSON.stringify(name)}`}`),
  getAllByRole: (role, { name } = {}) => findRole(role, name),
  // queryBy… — the element, or null when it is not there (for "is not on the screen" checks).
  queryByText: (text) => findText(text)[0] ?? null,
  queryByLabelText: (label) => findLabel(label)[0] ?? null,
  // findBy… — waits until it appears (2 s at most); use it after anything asynchronous.
  findByText: (text, options) => waitFor(() => screen.getByText(text), options),
  findByLabelText: (label, options) => waitFor(() => screen.getByLabelText(label), options),
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

// The React props of the nearest component around a page element that has `onPress`:
// the way a press reaches a React Native Pressable, without a browser click.
function pressHandler(element) {
  const key = Object.keys(element).find((name) => name.startsWith("__reactFiber$"));
  for (let fiber = key ? element[key] : null; fiber; fiber = fiber.return) {
    if (typeof fiber.memoizedProps?.onPress === "function") return fiber.memoizedProps;
  }
  return null;
}

export const userEvent = {
  setup() {
    return {
      // Presses an element like a finger would; a disabled element ignores it.
      async press(element) {
        if (!(element instanceof Element) || !element.isConnected) throw new AssertionError(`${WORDS.notFound} ${show(element)}`);
        const props = pressHandler(element);
        if (!props || props.disabled || element.getAttribute("aria-disabled") === "true") return;
        flushSync(() => props.onPress({ nativeEvent: {}, type: "press" }));
        await settle();
      },
    };
  },
};

// Runs every registered test, one after another, and prints one line per test.
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

export function setDefaultTimeout(ms) {
  defaultTimeoutMs = ms;
}
