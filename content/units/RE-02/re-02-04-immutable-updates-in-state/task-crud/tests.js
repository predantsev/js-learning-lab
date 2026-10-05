import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";
import { tasks } from "./tasks.js";

// What the starting tasks looked like before any check ran.
const original = JSON.stringify(tasks);

// Puts the starting tasks back as they were, so that a change one check made to the array from
// tasks.js (push, splice, a changed field) cannot spill over into the next check.
function restoreTasks() {
  tasks.splice(0, tasks.length, ...JSON.parse(original));
}

// Every check shows its own fresh copy of the list, starting from the three tasks.
function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  flushSync(() => createRoot(host).render(createElement(App)));
  return host;
}
const rows = (host) => [...host.querySelectorAll("li")];
const part = (row, name) => (row.querySelector("." + name)?.textContent ?? "").trim();
const button = (row, name) => [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === name);
const addButton = (host) => [...host.querySelectorAll("button")].find((b) => b.textContent.trim() === L.add);

test("Add puts a new pending task at the end", async () => {
  restoreTasks();
  const host = mount();
  await user.click(addButton(host));
  const after = rows(host);
  expect(after.length, "number of rows after one click on Add").toBe(4);
  expect(part(after[3], "title"), "title of the last row").toBe(L.newTitle);
  expect(part(after[3], "status"), "status of the last row").toBe(L.pending);
});

test("Toggle flips only that task and keeps its other fields", async () => {
  restoreTasks();
  const host = mount();
  await user.click(button(rows(host)[1], L.toggle));
  const after = rows(host);
  expect(part(after[1], "status"), "status of the second row").toBe(L.done);
  expect(part(after[1], "title"), "title of the second row").toBe(L.libraryBooks);
  expect(part(after[1], "priority"), "priority of the second row").toBe("high");
  expect(part(after[0], "status"), "status of the first row").toBe(L.pending);
  expect(part(after[2], "status"), "status of the third row").toBe(L.pending);
});

test("Remove takes out only that task", async () => {
  restoreTasks();
  const host = mount();
  await user.click(button(rows(host)[0], L.remove));
  expect(rows(host).map((row) => part(row, "title")), "titles left").toEqual([L.libraryBooks, L.grandma]);
});

test("the starting tasks stay unchanged", async () => {
  restoreTasks();
  // Each action starts from a fresh copy, so each one works on the starting array itself.
  const removing = mount();
  await user.click(button(rows(removing)[0], L.remove));
  const toggling = mount();
  await user.click(button(rows(toggling)[1], L.toggle));
  const adding = mount();
  await user.click(addButton(adding));
  expect(JSON.stringify(tasks), "the array from tasks.js and its task objects").toBe(original);
});
