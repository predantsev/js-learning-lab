import { test, expect, screen, user, waitFor } from "./testing.js";
import { renderApp } from "./testApp.jsx";

// Three tests, but none visits an unknown category: a page that shows nothing there passes.
test("%%tTotal%%", async () => {
  renderApp("/categories/food");
  await screen.findByText("%%total%%: 1056.00 %%currency%%");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(2);
});

test("%%tTotal%%", async () => {
  renderApp("/categories/transport");
  await screen.findByText("%%total%%: 520.00 %%currency%%");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(1);
});

test("%%tSwitch%%", async () => {
  const history = renderApp("/categories/food");
  await screen.findByText("%%total%%: 1056.00 %%currency%%");
  history.push("/categories/fun");
  await screen.findByText("%%total%%: 480.00 %%currency%%");
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%fun%%");
});
