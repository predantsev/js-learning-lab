import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";

// Every check shows its own fresh copy of App.
function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  flushSync(() => createRoot(host).render(createElement(App)));
  const byText = (selector, text) => [...host.querySelectorAll(selector)].find((b) => b.textContent.trim() === text) ?? null;
  return {
    pick: (name) => user.click(byText(".picker button", name)),
    filter: (label) => user.click(byText(".filter button", label)),
    nameField: () => [...host.querySelectorAll(".edit label")].find((l) => l.textContent.includes(L.nameLabel))?.querySelector("input") ?? null,
    pickerNames: () => [...host.querySelectorAll(".picker button")].map((b) => b.textContent.trim()),
  };
}

test("the form shows the first wish at first", () => {
  const app = mount();
  expect(app.nameField(), "the name field").toHaveValue(L.headphones);
});

test("picking another wish shows its name in the form", async () => {
  const app = mount();
  await app.pick(L.lamp);
  expect(app.nameField(), "the name field after picking the second wish").toHaveValue(L.lamp);
});

test("a typed draft does not follow you to another wish or back", async () => {
  const app = mount();
  await user.fill(app.nameField(), L.draft);
  await app.pick(L.bicycle);
  expect(app.nameField(), "the name field after switching away").toHaveValue(L.bicycle);
  await app.pick(L.headphones);
  expect(app.nameField(), "the name field after switching back").toHaveValue(L.headphones);
});

test("the picker keeps its filter when another wish is picked", async () => {
  const app = mount();
  await app.filter(L.wanted);
  await app.pick(L.bicycle);
  expect(app.pickerNames(), "wishes in the picker").toEqual([L.headphones, L.lamp, L.bicycle]);
});
