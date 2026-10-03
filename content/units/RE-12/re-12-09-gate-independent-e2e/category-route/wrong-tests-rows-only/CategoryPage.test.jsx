import { test, expect, screen, user, waitFor } from "./testing.js";
import { renderApp } from "./testApp.jsx";

// Checks headings and row counts but never a total: a page whose total is wrong passes.
test("%%tTotal%%", async () => {
  renderApp("/categories/food");
  await screen.findByText("%%food%%");
  expect(screen.queryAllByRole("listitem").length, "%%mRows%%").toBe(2);
});

test("%%tUnknown%%", async () => {
  renderApp("/categories/rent");
  await screen.findByText("%%notFound%%");
  expect(screen.getByText("%%backToList%%").getAttribute("href"), "%%mBack%%").toBe("/expenses");
});

test("%%tSwitch%%", async () => {
  const history = renderApp("/categories/food");
  await screen.findByText("%%food%%");
  history.push("/categories/fun");
  await screen.findByText("%%fun%%");
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%fun%%");
});
