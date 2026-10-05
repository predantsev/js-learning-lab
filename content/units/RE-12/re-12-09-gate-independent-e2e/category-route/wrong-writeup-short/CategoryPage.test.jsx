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

test("%%tSwitch%%", async () => {
  const history = renderApp("/categories/food");
  await screen.findByText("%%total%%: 1056.00 %%currency%%");
  history.push("/categories/fun");
  await screen.findByText("%%total%%: 480.00 %%currency%%");
  expect(screen.getByRole("heading").textContent, "%%mHeading%%").toBe("%%fun%%");
});
