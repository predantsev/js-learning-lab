import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";

// Every check shows its own fresh copy of the list.
function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  flushSync(() => createRoot(host).render(createElement(App)));
  return host;
}
const filterButton = (host, name) => [...host.querySelectorAll(".filter button")].find((b) => b.textContent.trim() === name);
const labels = (host) => [...host.querySelectorAll("li")].map((li) => li.textContent);
const summary = (host) => (host.querySelector(".summary")?.textContent ?? "").replace(/\s+/g, " ").trim();
const expected = (count, total) => `${L.shown}: ${count} · ${L.total}: ${total} ${L.currency}`;

test("at first every expense is shown with the full total", () => {
  const host = mount();
  expect(labels(host).length, "number of rows").toBe(6);
  expect(summary(host), "the summary").toBe(expected(6, "2155.90"));
});

test("a category button shows only that category and its total", async () => {
  const host = mount();
  await user.click(filterButton(host, L.food));
  expect(labels(host).length, "number of rows").toBe(2);
  expect(labels(host).join(" | "), "the rows").toContain(L.groceries);
  expect(labels(host).join(" | "), "the rows").toContain(L.lunch);
  expect(summary(host), "the summary").toBe(expected(2, "1056.00"));
});

test("the all button shows every expense again", async () => {
  const host = mount();
  await user.click(filterButton(host, L.transport));
  await user.click(filterButton(host, L.all));
  expect(labels(host).length, "number of rows").toBe(6);
  expect(summary(host), "the summary").toBe(expected(6, "2155.90"));
});

test("removing a shown expense updates the rows and the summary", async () => {
  const host = mount();
  await user.click(filterButton(host, L.fun));
  const coffeeRow = [...host.querySelectorAll("li")].find((li) => li.textContent.includes(L.coffee));
  await user.click(coffeeRow.querySelector("button"));
  expect(labels(host).length, "number of rows").toBe(1);
  expect(labels(host)[0], "the row left").toContain(L.cinema);
  expect(summary(host), "the summary").toBe(expected(1, "300.00"));
});
