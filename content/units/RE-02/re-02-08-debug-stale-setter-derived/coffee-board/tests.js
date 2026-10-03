import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";

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

test("three quick clicks add three coffees", async () => {
  const board = mount();
  await board.add();
  await board.add();
  await board.add();
  await sleep(600);
  expect(coffees(board.rows()), "coffee rows after three quick clicks").toBe(3);
});

test("the total counts all three quick coffees", async () => {
  const board = mount();
  await board.add();
  await board.add();
  await board.add();
  await sleep(600);
  expect(board.total(), "the total paragraph").toBe(totalText("1371.00"));
});

test("removing an expense updates the total", async () => {
  const board = mount();
  await board.remove(L.lunch);
  expect(board.total(), "the total paragraph").toBe(totalText("1025.50"));
});

test("a new coffee shows up while the Fun filter is on", async () => {
  const board = mount();
  await board.filter(L.fun);
  await board.add();
  await sleep(600);
  expect(coffees(board.rows()), "coffee rows under the Fun filter").toBe(1);
  expect(board.rows().length, "rows under the Fun filter").toBe(2);
});
