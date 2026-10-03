import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";
import { tasks } from "./tasks.js";

// What the starting tasks looked like before any check ran.
const original = JSON.stringify(tasks);

// Every check shows its own fresh copy of the list.
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
  const host = mount();
  await user.click(addButton(host));
  const after = rows(host);
  expect(after.length, "number of rows after one click on Add").toBe(4);
  expect(part(after[3], "title"), "title of the last row").toBe(L.newTitle);
  expect(part(after[3], "status"), "status of the last row").toBe(L.pending);
});

test("Toggle flips only that task and keeps its other fields", async () => {
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
  const host = mount();
  await user.click(button(rows(host)[0], L.remove));
  expect(rows(host).map((row) => part(row, "title")), "titles left").toEqual([L.libraryBooks, L.grandma]);
});

test("the starting tasks stay unchanged", async () => {
  const host = mount();
  await user.click(addButton(host));
  await user.click(button(rows(host)[2], L.toggle));
  await user.click(button(rows(host)[0], L.remove));
  expect(JSON.stringify(tasks), "the array from tasks.js and its task objects").toBe(original);
});
