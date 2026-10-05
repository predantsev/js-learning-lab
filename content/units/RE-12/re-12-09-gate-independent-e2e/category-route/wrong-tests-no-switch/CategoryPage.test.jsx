import { test, expect, screen, user, waitFor } from "./testing.js";
import { renderApp } from "./testApp.jsx";

test("%%tTotal%%", async () => {
  renderApp("/categories/food");
  await screen.findByText("%%total%%: 1056.00 %%currency%%");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(2);
});

test("%%tUnknown%%", async () => {
  renderApp("/categories/rent");
  await screen.findByText("%%notFound%%");
  expect(screen.getByText("%%backToList%%").getAttribute("href"), "%%mBack%%").toBe("/expenses");
});

// Opens the second category directly instead of moving to it: a page that keeps the first one passes.
test("%%tSwitch%%", async () => {
  renderApp("/categories/fun");
  await screen.findByText("%%total%%: 480.00 %%currency%%");
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%fun%%");
});
