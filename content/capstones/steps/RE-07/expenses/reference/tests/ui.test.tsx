// User-action tests of the async data layer: the whole app is rendered (under StrictMode, as on the
// page) against the fixture API, which every test fills itself through resetApi. The tests find
// things by labels, roles and text, act like a person and wait for what appears on the screen.
import { StrictMode } from "react";
import { test, expect, render, screen, within, user, waitFor } from "./ui-testing.js";
import { resetApi, settings, requests } from "../data/api.ts";
import { App } from "../ui/App.tsx";

const START = [
  { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" as const },
  { id: "e-02", label: "%%fixture2Name%%", amountMinor: 52000, date: "2026-03-02", category: "transport" as const },
];

// The labels of the cards on the screen, in their order.
const labels = () => screen.queryAllByRole("listitem").map((card) => card.querySelector("h3")?.textContent);
const cardOf = (label: string) => screen.getByText(label).closest("li") as HTMLElement;
// The totals line: the paragraph that names the total.
const totals = () => [...document.querySelectorAll("p")].find((line) => line.textContent?.includes("%%totalLabel%%"))?.textContent;

function showApp() {
  resetApi(START);
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Sets a whole value at once — a date field takes no text letter by letter — and sends the input event.
function fill(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

// Chooses an option of a <select> the way a person does: the value changes, then a change event.
function choose(select: HTMLSelectElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

test("the list shows the loading state, then the expenses of the API", async () => {
  showApp();
  expect(screen.queryByText("%%loadingListMessage%%") !== null, "the loading text right after the start").toBe(true);
  await screen.findByText("%%fixture1Name%%");
  expect(labels(), "cards").toEqual(["%%fixture1Name%%", "%%fixture2Name%%"]);
});

test("a new expense appears in the list after saving", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  await user.type(screen.getByLabelText("%%nameLabel%%"), "%%newName%%");
  await user.type(screen.getByLabelText("%%valueLabel%%"), "145%%decimalMark%%50");
  fill(screen.getByLabelText("%%dateFieldLabel%%") as HTMLInputElement, "2026-03-02");
  choose(screen.getByLabelText("%%categoryFieldLabel%%") as HTMLSelectElement, "transport");
  await user.click(screen.getByRole("button", { name: "%%saveLabel%%" }));
  await screen.findByText("%%newName%%");
  expect(labels(), "cards").toEqual(["%%fixture1Name%%", "%%fixture2Name%%", "%%newName%%"]);
});

test("a failed delete brings the expense and the totals back and says which one stayed", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  await waitFor(() => totals() !== undefined);
  const before = totals();
  settings.failNextWrite = 1;
  await user.click(within(cardOf("%%fixture1Name%%")).getByRole("button", { name: "%%deleteLabel%%: %%fixture1Name%%" }));
  await user.click(within(cardOf("%%fixture1Name%%")).getByRole("button", { name: "%%confirmDeleteLabel%%: %%fixture1Name%%" }));
  // At once, before the API answers: the card and its amount are gone.
  expect(labels(), "cards right after the confirmation").toEqual(["%%fixture2Name%%"]);
  expect(totals() !== before, "the totals right after the confirmation differ").toBe(true);
  await waitFor(() => screen.queryAllByRole("status").some((line) => line.textContent?.includes("%%fixture1Name%%")));
  expect(labels(), "cards after the failure").toEqual(["%%fixture1Name%%", "%%fixture2Name%%"]);
  expect(totals(), "the totals after the failure").toBe(before);
});

test("a failed load shows the error, and the retry button loads the list", async () => {
  resetApi(START);
  settings.failNextRead = 2; // the list and the summary both ask first
  render(
    <StrictMode>
      <App />
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
      <App />
    </StrictMode>,
  );

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await user.click(await screen.findByRole("button", { name: "%%retryLoadLabel%%" }));
  }
  await screen.findByText("%%noMoreRetriesMessage%%");
  expect(screen.queryByRole("button", { name: "%%retryLoadLabel%%" }), "the retry button").toBe(null);
});

test("a long list shows 50 cards, and Show more adds the next page with focus on its first card", async () => {
  resetApi(Array.from({ length: 60 }, (_, index) => ({ ...START[0], id: "x-" + (index + 1), label: "%%fixture1Name%% " + (index + 1) })));
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  await screen.findByText("%%fixture1Name%% 1");
  expect(screen.queryAllByRole("listitem").length, "cards on the first page").toBe(50);
  await user.click(screen.getByRole("button", { name: "%%moreLabel%%" }));
  expect(screen.queryAllByRole("listitem").length, "cards after Show more").toBe(60);
  expect(document.activeElement?.textContent, "the element with focus").toBe("%%fixture1Name%% 51");
  expect(screen.queryByRole("button", { name: "%%moreLabel%%" }), "the Show more button on the last page").toBe(null);
});

test("a quick filter change aborts the older request and shows the last filter", async () => {
  showApp();
  await screen.findByText("%%fixture1Name%%");
  const filter = screen.getByLabelText("%%filterLabel%%") as HTMLSelectElement;
  choose(filter, "transport");
  choose(filter, "food");
  await waitFor(() => labels().length === 1 && labels()[0] === "%%fixture1Name%%");
  const older = requests.filter((request) => request.what === "list transport").map((request) => request.outcome);
  expect(older, "the outcome of the request for the transport expenses").toEqual(["aborted"]);
});
