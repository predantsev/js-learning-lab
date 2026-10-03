import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { HabitList } from "./HabitList";
import { habits } from "./habits.js";

function withList(props, check) {
  expect(typeof HabitList, "type of HabitList").toBe("function");
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(createElement(HabitList, props)));
    check(host);
  } finally {
    root.unmount();
    host.remove();
  }
}
const names = (host) => [...host.querySelectorAll("li")].map((li) => li.textContent.trim());
const nameOf = (id) => habits.find((habit) => habit.id === id).name;

test("status active shows only the active habits, in order", () => {
  withList({ habits, status: "active" }, (host) => {
    expect(names(host), "the items for status active").toEqual(["h-01", "h-02", "h-03", "h-04", "h-06"].map(nameOf));
  });
});

test("status paused shows only the paused habit", () => {
  withList({ habits, status: "paused" }, (host) => {
    expect(names(host), "the items for status paused").toEqual([nameOf("h-05")]);
  });
});

test("no matching habits shows only the empty-state message", () => {
  const allActive = habits.filter((habit) => habit.active);
  withList({ habits: allActive, status: "paused" }, (host) => {
    expect(host.querySelectorAll("li"), "list items when nothing matches").toHaveLength(0);
    expect(host.querySelector("p"), "a paragraph when nothing matches").toHaveTextContent(L.empty);
    expect(host.textContent.trim(), "the whole text when nothing matches").toBe(L.empty);
  });
});

test("an empty array shows the empty-state message and no list", () => {
  withList({ habits: [], status: "active" }, (host) => {
    expect(host.querySelector("ul"), "a <ul> for an empty array").toBeNull();
    expect(host.textContent.trim(), "the whole text for an empty array").toBe(L.empty);
  });
});

test("the page shows five active and one paused habit", async () => {
  await settle();
  expect(document.querySelectorAll("#root li"), "list items on the page").toHaveLength(6);
});

test("each item keeps its element when the habits are reordered", () => {
  expect(typeof HabitList, "type of HabitList").toBe("function");
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(createElement(HabitList, { habits, status: "active" })));
    const before = [...host.querySelectorAll("li")].find((li) => li.textContent.trim() === nameOf("h-02"));
    flushSync(() => root.render(createElement(HabitList, { habits: habits.toReversed(), status: "active" })));
    const after = [...host.querySelectorAll("li")].find((li) => li.textContent.trim() === nameOf("h-02"));
    expect(after, `the <li> of “${nameOf("h-02")}” after the order is reversed is the same element as before`).toBe(before);
  } finally {
    root.unmount();
    host.remove();
  }
});
