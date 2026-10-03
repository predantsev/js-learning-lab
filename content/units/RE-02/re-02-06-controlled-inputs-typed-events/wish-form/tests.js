import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";

// Every check shows its own fresh copy of the form.
function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  flushSync(() => createRoot(host).render(createElement(App)));
  const field = (label) => [...host.querySelectorAll("label")].find((l) => l.textContent.includes(label))?.querySelector("input") ?? null;
  return {
    form: host.querySelector("form"),
    name: field(L.nameLabel),
    price: field(L.priceLabel),
    error: (which) => (host.querySelector(`.${which}-error`)?.textContent ?? "").trim(),
    rows: () => [...host.querySelectorAll("li")].map((li) => li.textContent),
  };
}

test("typing changes both fields", async () => {
  const f = mount();
  await user.fill(f.name, L.headphones);
  await user.fill(f.price, "80");
  expect(f.name, "the name field").toHaveValue(L.headphones);
  expect(f.price, "the price field").toHaveValue("80");
});

test("submitting does not reload the page", async () => {
  const f = mount();
  await user.fill(f.name, L.lamp);
  const { prevented } = await user.submit(f.form);
  expect(prevented, "preventDefault was called during the submit event").toBe(true);
});

test("an empty name shows its message under the name field", async () => {
  const f = mount();
  await user.fill(f.price, "10");
  await user.submit(f.form);
  expect(f.error("name"), "text of .name-error").toBe(L.required);
  expect(f.error("price"), "text of .price-error").toBe("");
  expect(f.rows().length, "number of wishes in the list").toBe(0);
});

test("a negative price shows its message under the price field", async () => {
  const f = mount();
  await user.fill(f.name, L.lamp);
  await user.fill(f.price, "-5");
  await user.submit(f.form);
  expect(f.error("price"), "text of .price-error").toBe(L.negative);
  expect(f.error("name"), "text of .name-error").toBe("");
});

test("a valid wish is added once, the fields and messages are cleared", async () => {
  const f = mount();
  await user.submit(f.form);
  await user.fill(f.name, L.headphones);
  await user.fill(f.price, "80");
  await user.submit(f.form);
  expect(f.rows(), "the list").toEqual([`${L.headphones} — 80 ${L.currency}`]);
  expect(f.name, "the name field after adding").toHaveValue("");
  expect(f.price, "the price field after adding").toHaveValue("");
  expect(f.error("name"), "text of .name-error").toBe("");
  expect(f.error("price"), "text of .price-error").toBe("");
});

test("an empty price adds a wish without a price", async () => {
  const f = mount();
  await user.fill(f.name, L.tickets);
  await user.submit(f.form);
  expect(f.rows(), "the list").toEqual([`${L.tickets} — ${L.noPrice}`]);
});
