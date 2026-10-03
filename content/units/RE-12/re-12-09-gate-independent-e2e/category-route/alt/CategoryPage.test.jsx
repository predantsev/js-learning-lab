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
  history.push("/categories/transport");
  await screen.findByText("%%transport%%");
  expect(screen.queryByText("%%total%%: 520.00 %%currency%%") !== null, "%%mHeading%%").toBe(true);
});
