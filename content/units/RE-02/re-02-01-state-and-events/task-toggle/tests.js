import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";
import { task } from "./task.js";

// Every check shows its own fresh copy of App, so one check's clicks never affect another.
function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  flushSync(() => createRoot(host).render(createElement(App)));
  return host;
}
const statusOf = (host) => (host.querySelector(".status")?.textContent ?? "").trim();
const buttonOf = (host) => host.querySelector("button");

test("starts with the status of the task", () => {
  const host = mount();
  expect(statusOf(host), "the status paragraph").toBe(L.statusDone);
  expect(buttonOf(host), "the button").toHaveTextContent(L.markPending);
});

test("a pending task starts as pending", () => {
  // The same component must follow the data: show it for a task that is not done yet.
  task.done = false;
  try {
    const host = mount();
    expect(statusOf(host), "the status paragraph for a pending task").toBe(L.statusPending);
    expect(buttonOf(host), "the button for a pending task").toHaveTextContent(L.markDone);
  } finally {
    task.done = true;
  }
});

test("one click shows the other status", async () => {
  const host = mount();
  await user.click(buttonOf(host));
  expect(statusOf(host), "the status paragraph after one click").toBe(L.statusPending);
  expect(buttonOf(host), "the button after one click").toHaveTextContent(L.markDone);
});

test("a second click shows the first status again", async () => {
  const host = mount();
  await user.click(buttonOf(host));
  await user.click(buttonOf(host));
  expect(statusOf(host), "the status paragraph after two clicks").toBe(L.statusDone);
  expect(buttonOf(host), "the button after two clicks").toHaveTextContent(L.markPending);
});
