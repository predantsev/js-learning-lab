// User-action tests of the async data layer: the whole app is rendered (under StrictMode, as on the
// page) against the fixture API, which every test fills itself through resetApi. The tests find
// things by labels, roles and text, act like a person and wait for what appears on the screen.
import { StrictMode } from "react";
import { test, expect, render, screen, within, user, waitFor } from "./ui-testing.js";
import { resetApi, settings, requests } from "../data/api.ts";
import { App } from "../ui/App.tsx";

const START = [
  { id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: "%%techCategory%%" },
  { id: "w-02", name: "%%fixture2Name%%", price: 45, acquired: true, category: "%%homeCategory%%" },
];

// The names of the cards on the screen, in their order.
const names = () => screen.queryAllByRole("listitem").map((card) => card.querySelector("h3")?.textContent);
const cardOf = (name: string) => screen.getByText(name).closest("li") as HTMLElement;

function showApp() {
  resetApi(START);
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Chooses an option of a <select> the way a person does: the value changes, then a change event.
function choose(select: HTMLSelectElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

test("the list shows the loading state, then the wishes of the API", async () => {
  showApp();
  expect(screen.queryByText("%%loadingListMessage%%") !== null, "the loading text right after the start").toBe(true);
  await screen.findByText("%%fixture1Name%%");
  expect(names(), "cards").toEqual(["%%fixture1Name%%", "%%fixture2Name%%"]);
});

test("a new wish appears in the list after saving", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  await user.type(screen.getByLabelText("%%nameLabel%%"), "%%newName%%");
  await user.click(screen.getByRole("button", { name: "%%saveLabel%%" }));
  await screen.findByText("%%newName%%");
  expect(names(), "cards").toEqual(["%%fixture1Name%%", "%%fixture2Name%%", "%%newName%%"]);
});

test("a failed acquired toggle rolls back that wish and says which one was not saved", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  settings.failNextWrite = 1;
  await user.click(within(cardOf("%%fixture1Name%%")).getByRole("button", { name: "%%markAcquiredLabel%%: %%fixture1Name%%" }));
  // At once, before the API answers: the mark is already there.
  expect(within(cardOf("%%fixture1Name%%")).queryByText("%%acquiredMark%%") !== null, "the mark right after the click").toBe(true);
  await waitFor(() => screen.queryAllByRole("status").some((line) => line.textContent?.includes("%%fixture1Name%%")));
  expect(within(cardOf("%%fixture1Name%%")).queryByText("%%acquiredMark%%"), "the mark after the failure").toBe(null);
  expect(within(cardOf("%%fixture2Name%%")).queryByText("%%acquiredMark%%") !== null, "the other wish keeps its mark").toBe(true);
});

test("a quick filter change aborts the older request and shows the last filter", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  const filter = screen.getByLabelText("%%filterLabel%%") as HTMLSelectElement;
  choose(filter, "acquired");
  choose(filter, "wanted");
  await waitFor(() => names().length === 1 && names()[0] === "%%fixture1Name%%");
  const older = requests.filter((request) => request.what === "list acquired").map((request) => request.outcome);
  expect(older, "the outcome of the request for the acquired wishes").toEqual(["aborted"]);
});
