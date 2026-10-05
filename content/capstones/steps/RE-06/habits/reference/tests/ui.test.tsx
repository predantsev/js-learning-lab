// User-action tests of the async data layer: the whole app is rendered (under StrictMode, as on the
// page) against the fixture API, which every test fills itself through resetApi. The tests find
// things by labels, roles and text, act like a person and wait for what appears on the screen.
import { StrictMode } from "react";
import { test, expect, render, screen, within, user, waitFor } from "./ui-testing.js";
import { resetApi, settings, requests } from "../data/api.ts";
import { App } from "../ui/App.tsx";

const TODAY = "2026-03-02";
const DAYS = ["2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01"];
const START = [
  { id: "h-01", name: "%%fixture1Name%%", frequency: "daily" as const, active: true, completions: ["2026-02-27", "2026-03-01"] },
  { id: "h-02", name: "%%fixture2Name%%", frequency: "weekly" as const, active: false, completions: [] },
];

// The names of the cards on the screen, in their order.
const names = () => screen.queryAllByRole("listitem").map((card) => card.querySelector("h3")?.textContent);
const cardOf = (name: string) => screen.getByText(name).closest("li") as HTMLElement;
const countLine = (name: string) => within(cardOf(name)).queryByText("%%completionsLabel%%: 2") !== null ? 2 : within(cardOf(name)).queryByText("%%completionsLabel%%: 3") !== null ? 3 : -1;

function showApp() {
  resetApi(START);
  render(
    <StrictMode>
      <App today={TODAY} days={DAYS} />
    </StrictMode>,
  );
}

// Chooses an option of a <select> the way a person does: the value changes, then a change event.
function choose(select: HTMLSelectElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

test("the list shows the loading state, then the habits of the API", async () => {
  showApp();
  expect(screen.queryByText("%%loadingListMessage%%") !== null, "the loading text right after the start").toBe(true);
  await screen.findByText("%%fixture1Name%%");
  expect(names(), "cards").toEqual(["%%fixture1Name%%", "%%fixture2Name%%"]);
});

test("a new habit appears in the list after saving", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  await user.type(screen.getByLabelText("%%nameLabel%%"), "%%newName%%");
  await user.click(screen.getByRole("button", { name: "%%saveLabel%%" }));
  await screen.findByText("%%newName%%");
  expect(names(), "cards").toEqual(["%%fixture1Name%%", "%%fixture2Name%%", "%%newName%%"]);
});

test("a failed mark of today rolls back that habit without losing its other days", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  settings.failNextWrite = 1;
  await user.click(within(cardOf("%%fixture1Name%%")).getByRole("button", { name: "%%markTodayLabel%%: %%fixture1Name%%" }));
  // At once, before the API answers: today is already counted.
  expect(countLine("%%fixture1Name%%"), "completions right after the click").toBe(3);
  await waitFor(() => screen.queryAllByRole("status").some((line) => line.textContent?.includes("%%fixture1Name%%")));
  expect(countLine("%%fixture1Name%%"), "completions after the failure").toBe(2);
  expect(within(cardOf("%%fixture1Name%%")).queryByText("%%doneTodayMark%%"), "the today mark after the failure").toBe(null);
});

test("a failed load shows the error, and the retry button loads the list", async () => {
  resetApi(START);
  settings.failNextRead = 2; // the list and the summary both ask first
  render(
    <StrictMode>
      <App today={TODAY} days={DAYS} />
    </StrictMode>,
  );

  const retry = await screen.findByRole("button", { name: "%%retryLoadLabel%%" });
  expect(screen.queryAllByRole("status").some((line) => line.textContent?.includes("%%listLoadFailedMessage%%")), "the error in a status line").toBe(true);
  await user.click(retry);
  await screen.findByText("%%fixture1Name%%");
});

test("after three failed retries the retry button is gone", async () => {
  resetApi(START);
  settings.failNextRead = 100;
  render(
    <StrictMode>
      <App today={TODAY} days={DAYS} />
    </StrictMode>,
  );

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await user.click(await screen.findByRole("button", { name: "%%retryLoadLabel%%" }));
  }
  await screen.findByText("%%noMoreRetriesMessage%%");
  expect(screen.queryByRole("button", { name: "%%retryLoadLabel%%" }), "the retry button").toBe(null);
});

test("a quick filter change aborts the older request and shows the last filter", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  const filter = screen.getByLabelText("%%filterLabel%%") as HTMLSelectElement;
  choose(filter, "paused");
  choose(filter, "active");
  await waitFor(() => names().length === 1 && names()[0] === "%%fixture1Name%%");
  const older = requests.filter((request) => request.what === "list paused").map((request) => request.outcome);
  expect(older, "the outcome of the request for the paused habits").toEqual(["aborted"]);
});
