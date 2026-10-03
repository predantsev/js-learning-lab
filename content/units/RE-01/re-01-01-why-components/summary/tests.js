import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Summary } from "./Summary";
import { expenses } from "./expenses.js";

// Renders Summary on its own into a fresh element and returns that element.
function renderSummary() {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  flushSync(() => root.render(createElement(Summary)));
  return { host, done: () => { root.unmount(); host.remove(); } };
}
const squash = (text) => text.replace(/\s+/g, " ").trim();

test("Summary shows the heading", () => {
  expect(typeof Summary, "type of Summary").toBe("function");
  const view = renderSummary();
  try {
    expect(view.host.querySelector("h2"), "an h2 heading in what Summary returns").toHaveTextContent(L.heading);
  } finally {
    view.done();
  }
});

test("Summary shows the number of expenses", () => {
  expect(typeof Summary, "type of Summary").toBe("function");
  const view = renderSummary();
  try {
    const p = view.host.querySelector("p");
    expect(p, "a paragraph in what Summary returns").toBeTruthy();
    expect(squash(p.textContent), "the paragraph text").toBe(`${L.countLabel} ${expenses.length}`);
  } finally {
    view.done();
  }
});

test("the count follows the data", () => {
  expect(typeof Summary, "type of Summary").toBe("function");
  expenses.push({ id: "e-99", label: "test", amountMinor: 100 });
  const view = renderSummary();
  try {
    const p = view.host.querySelector("p");
    expect(squash(p?.textContent ?? ""), "the paragraph text after a fifth expense was added to the data").toBe(`${L.countLabel} 5`);
  } finally {
    view.done();
    expenses.pop();
  }
});

test("the page shows the summary above the list", async () => {
  await settle();
  const root = document.getElementById("root");
  expect(root.querySelector("h2"), "the h2 heading on the page").toHaveTextContent(L.heading);
  expect(root.querySelectorAll("li"), "the expense items on the page").toHaveLength(expenses.length);
});
