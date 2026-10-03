// User-action tests of the async data layer: the whole app is rendered (under StrictMode, as on the
// page) against the fixture API, which every test fills itself through resetApi. The tests find
// things by labels, roles and text, act like a person and wait for what appears on the screen.
import { StrictMode } from "react";
import { test, expect, render, screen, within, user, waitFor } from "./ui-testing.js";
import { resetApi, settings, requests } from "../data/api.ts";
import { App } from "../ui/App.tsx";

const TODAY = "2026-03-02";
const START = [
  { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-01", done: false, priority: "high" as const },
  { id: "t-02", title: "%%fixture2Name%%", dueDate: null, done: true, priority: "low" as const },
];

// The titles of the cards on the screen, in their order.
const titles = () => screen.queryAllByRole("listitem").map((card) => card.querySelector("h3")?.textContent);
const cardOf = (title: string) => screen.getByText(title).closest("li") as HTMLElement;

function showApp() {
  resetApi(START);
  render(
    <StrictMode>
      <App today={TODAY} />
    </StrictMode>,
  );
}

// Chooses an option of a <select> the way a person does: the value changes, then a change event.
function choose(select: HTMLSelectElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

test("the list shows the loading state, then the tasks of the API", async () => {
  showApp();
  expect(screen.queryByText("%%loadingListMessage%%") !== null, "the loading text right after the start").toBe(true);
  await screen.findByText("%%fixture1Name%%");
  expect(titles(), "cards").toEqual(["%%fixture1Name%%", "%%fixture2Name%%"]);
});

test("a new task appears in the list after saving", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  await user.type(screen.getByLabelText("%%nameLabel%%"), "%%newName%%");
  await user.click(screen.getByRole("button", { name: "%%saveLabel%%" }));
  await screen.findByText("%%newName%%");
  expect(titles(), "cards").toEqual(["%%fixture1Name%%", "%%fixture2Name%%", "%%newName%%"]);
});

test("a failed done toggle rolls back that task and says which one was not saved", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  settings.failNextWrite = 1;
  await user.click(within(cardOf("%%fixture1Name%%")).getByRole("button", { name: "%%markDoneLabel%%: %%fixture1Name%%" }));
  // At once, before the API answers: the mark is already there.
  expect(within(cardOf("%%fixture1Name%%")).queryByText("%%doneMark%%") !== null, "the mark right after the click").toBe(true);
  await waitFor(() => screen.queryAllByRole("status").some((line) => line.textContent?.includes("%%fixture1Name%%")));
  expect(within(cardOf("%%fixture1Name%%")).queryByText("%%doneMark%%"), "the mark after the failure").toBe(null);
  expect(within(cardOf("%%fixture2Name%%")).queryByText("%%doneMark%%") !== null, "the other task keeps its mark").toBe(true);
});

test("a quick filter change aborts the older request and shows the last filter", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  const filter = screen.getByLabelText("%%filterLabel%%") as HTMLSelectElement;
  choose(filter, "done");
  choose(filter, "pending");
  await waitFor(() => titles().length === 1 && titles()[0] === "%%fixture1Name%%");
  const older = requests.filter((request) => request.what === "list done").map((request) => request.outcome);
  expect(older, "the outcome of the request for the done tasks").toEqual(["aborted"]);
});
