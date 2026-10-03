import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App";

// Every check shows its own fresh copy of the component.
function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  flushSync(() => createRoot(host).render(createElement(App)));
  const buttons = [...host.querySelectorAll("button")];
  return {
    plusOne: buttons.find((b) => b.textContent.trim() === "+1"),
    plusFive: buttons.find((b) => b.textContent.trim() === "+5"),
    shown: () => (host.querySelector(".tickets")?.textContent ?? "").trim(),
  };
}

test("slow clicks: +1, then +5 gives 6", async () => {
  const { plusOne, plusFive, shown } = mount();
  await user.click(plusOne);
  await user.click(plusFive);
  expect(shown(), "the tickets paragraph").toBe(`${L.tickets}: 6`);
});

test("three +1 clicks in one go give 3", async () => {
  const { plusOne, shown } = mount();
  plusOne.click();
  plusOne.click();
  plusOne.click();
  await settle();
  expect(shown(), "the tickets paragraph").toBe(`${L.tickets}: 3`);
});

test("+1, +5, +1 in one go give 7", async () => {
  const { plusOne, plusFive, shown } = mount();
  plusOne.click();
  plusFive.click();
  plusOne.click();
  await settle();
  expect(shown(), "the tickets paragraph").toBe(`${L.tickets}: 7`);
});
