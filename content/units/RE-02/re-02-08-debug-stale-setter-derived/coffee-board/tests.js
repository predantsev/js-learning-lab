import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";

// A fake clock: while a check runs, setTimeout and setInterval only record timers, and the check
// moves time forward itself. No check waits for a real second, and none depends on how fast the
// computer is. clearTimeout/clearInterval are replaced too, so a fake id never clears a real timer.
function useFakeClock() {
  const real = {
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    setInterval: window.setInterval,
    clearInterval: window.clearInterval,
  };
  const timers = [];
  let now = 0;
  let nextId = 1;
  const add = (fn, ms, args, repeat) => {
    const id = `fake-${nextId++}`;
    const wait = Math.max(0, Number(ms) || 0);
    timers.push({ id, seq: nextId, at: now + wait, fn, args, every: repeat ? Math.max(1, wait) : null });
    return id;
  };
  const remove = (id) => {
    const index = timers.findIndex((timer) => timer.id === id);
    if (index !== -1) timers.splice(index, 1);
    else real.clearTimeout(id);
  };
  window.setTimeout = (fn, ms = 0, ...args) => add(fn, ms, args, false);
  window.setInterval = (fn, ms = 0, ...args) => add(fn, ms, args, true);
  window.clearTimeout = remove;
  window.clearInterval = remove;
  return {
    advance(ms) {
      const end = now + ms;
      for (;;) {
        timers.sort((a, b) => a.at - b.at || a.seq - b.seq);
        const next = timers[0];
        if (!next || next.at > end) break;
        timers.shift();
        now = next.at;
        if (next.every !== null) timers.push({ ...next, seq: nextId++, at: now + next.every });
        if (typeof next.fn === "function") next.fn(...next.args);
      }
      now = end;
    },
    restore() {
      Object.assign(window, real);
    },
  };
}

// Every check shows its own fresh copy of the board.
function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  flushSync(() => createRoot(host).render(createElement(App)));
  const button = (selector, text) => [...host.querySelectorAll(selector)].find((b) => b.textContent.trim() === text);
  return {
    add: () => user.click(host.querySelector(".add")),
    filter: (name) => user.click(button(".filter button", name)),
    remove: (label) => user.click([...host.querySelectorAll("li")].find((li) => li.textContent.includes(label)).querySelector("button")),
    rows: () => [...host.querySelectorAll("li")].map((li) => li.textContent),
    total: () => (host.querySelector(".total")?.textContent ?? "").trim(),
  };
}
const totalText = (amount) => `${L.total}: ${amount} ${L.currency}`;
const coffees = (rows) => rows.filter((row) => row.startsWith(L.coffee + " —")).length;

// Runs a check on the fake clock and puts the real timers back afterwards.
async function onFakeClock(body) {
  const clock = useFakeClock();
  try {
    await body(clock);
  } finally {
    clock.restore();
  }
}

test("three quick clicks add three coffees", () => onFakeClock(async (clock) => {
  const board = mount();
  await board.add();
  await board.add();
  await board.add();
  clock.advance(300);
  await settle();
  expect(coffees(board.rows()), "coffee rows 300 ms after three quick clicks").toBe(3);
}));

test("the total counts all three quick coffees", () => onFakeClock(async (clock) => {
  const board = mount();
  await board.add();
  await board.add();
  await board.add();
  clock.advance(300);
  await settle();
  expect(board.total(), "the total paragraph 300 ms after three quick clicks").toBe(totalText("1371.00"));
}));

test("removing an expense updates the total", async () => {
  const board = mount();
  await board.remove(L.lunch);
  expect(board.total(), "the total paragraph").toBe(totalText("1025.50"));
});

test("a new coffee shows up while the Fun filter is on", () => onFakeClock(async (clock) => {
  const board = mount();
  await board.filter(L.fun);
  await board.add();
  clock.advance(300);
  await settle();
  expect(coffees(board.rows()), "coffee rows under the Fun filter").toBe(1);
  expect(board.rows().length, "rows under the Fun filter").toBe(2);
}));
