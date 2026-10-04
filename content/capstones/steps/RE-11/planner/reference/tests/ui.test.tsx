// User-action tests of the async data layer: the whole app is rendered (under StrictMode, as on the
// page) against the fixture API, which every test fills itself through resetApi. The tests find
// things by labels, roles and text, act like a person and wait for what appears on the screen.
import { StrictMode } from "react";
import { test, expect, render, screen, within, user, waitFor } from "./ui-testing.js";
import { resetApi, settings, requests } from "../data/api.ts";
import { App } from "../ui/App.tsx";
import { summaryImport } from "../ui/SummaryRoute.tsx";

const TODAY = "2026-03-02";
const START = [
  { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-01", done: false, priority: "high" as const },
  { id: "t-02", title: "%%fixture2Name%%", dueDate: null, done: true, priority: "low" as const },
];

// The titles of the cards on the screen, in their order.
const titles = () => screen.queryAllByRole("listitem").map((card) => card.querySelector("h3")?.textContent);
const cardOf = (title: string) => screen.getByText(title).closest("li") as HTMLElement;

function showApp() {
  // Every test starts on the list, whatever address the previous test left.
  window.history.replaceState(null, "", "#/tasks");
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

test("a failed load shows the error, and the retry button loads the list", async () => {
  resetApi(START);
  settings.failNextRead = 2; // the list and the summary both ask first
  render(
    <StrictMode>
      <App today={TODAY} />
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
      <App today={TODAY} />
    </StrictMode>,
  );

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await user.click(await screen.findByRole("button", { name: "%%retryLoadLabel%%" }));
  }
  await screen.findByText("%%noMoreRetriesMessage%%");
  expect(screen.queryByRole("button", { name: "%%retryLoadLabel%%" }), "the retry button").toBe(null);
});

test("a long list shows 50 cards, and Show more adds the next page with focus on its first card", async () => {
  resetApi(Array.from({ length: 60 }, (_, index) => ({ ...START[0], id: "x-" + (index + 1), title: "%%fixture1Name%% " + (index + 1) })));
  render(
    <StrictMode>
      <App today={TODAY} />
    </StrictMode>,
  );

  await screen.findByText("%%fixture1Name%% 1");
  expect(screen.queryAllByRole("listitem").length, "cards on the first page").toBe(50);
  await user.click(screen.getByRole("button", { name: "%%moreLabel%%" }));
  expect(screen.queryAllByRole("listitem").length, "cards after Show more").toBe(60);
  expect(document.activeElement?.textContent, "the element with focus").toBe("%%fixture1Name%% 51");
  expect(screen.queryByRole("button", { name: "%%moreLabel%%" }), "the Show more button on the last page").toBe(null);
});

test("an API answer with a broken priority becomes an error state that names the field", async () => {
  resetApi(START);
  settings.nextListAnswer = [{ ...START[0], priority: "urgent" }];
  render(
    <StrictMode>
      <App today={TODAY} />
    </StrictMode>,
  );

  await waitFor(() => screen.queryAllByRole("status").some((line) => line.textContent?.includes("%%badDataLabel%%")));
  const line = screen.queryAllByRole("status").find((one) => one.textContent?.includes("%%badDataLabel%%"));
  expect(line?.textContent?.includes("1.priority: unknown"), "the status line names the field").toBe(true);
  expect(screen.queryByRole("button", { name: "%%retryLoadLabel%%" }) !== null, "a retry button").toBe(true);
});

test("the summary route shows its loading line while its module loads, then the summary", async () => {
  showApp();
  summaryImport.delayMs = 300;
  try {
    await waitFor(() => screen.queryByText("%%summaryLinkLabel%%") !== null);
    await user.click(screen.getByText("%%summaryLinkLabel%%"));
    expect(screen.queryByText("%%loadingSummaryMessage%%") !== null, "the Suspense fallback").toBe(true);
    expect(screen.queryByText("%%projectTitle%%") !== null, "the layout stays").toBe(true);
    await waitFor(() => screen.queryByRole("heading", { name: "%%summaryTitle%%" }) !== null);
  } finally {
    summaryImport.delayMs = 0;
  }
  expect(screen.queryByText("%%noneDueTodayMessage%%") !== null, "no task is due exactly today").toBe(true);
  expect([...document.querySelectorAll("p")].some((line) => line.textContent?.startsWith("%%dueSummary%%") && line.textContent.endsWith(": 1")), "one task due by today").toBe(true);
});

test("a failed load of the summary shows the error, and Try again loads it with a new lazy component", async () => {
  showApp();
  summaryImport.failNext = true;
  await waitFor(() => screen.queryByText("%%summaryLinkLabel%%") !== null);
  await user.click(screen.getByText("%%summaryLinkLabel%%"));
  await waitFor(() => screen.queryByRole("alert") !== null);
  await user.click(screen.getByRole("button", { name: "%%tryAgainLabel%%" }));
  await waitFor(() => screen.queryByRole("heading", { name: "%%summaryTitle%%" }) !== null);
  expect(screen.queryByRole("alert") === null, "the error is gone").toBe(true);
});

test("when the new attempt fails too, the summary error offers a page reload", async () => {
  showApp();
  summaryImport.failNext = true;
  await waitFor(() => screen.queryByText("%%summaryLinkLabel%%") !== null);
  await user.click(screen.getByText("%%summaryLinkLabel%%"));
  await waitFor(() => screen.queryByRole("alert") !== null);
  expect(screen.queryByRole("button", { name: "%%reloadPageLabel%%" }) === null, "no reload after the first failure").toBe(true);
  summaryImport.failNext = true;
  await user.click(screen.getByRole("button", { name: "%%tryAgainLabel%%" }));
  await waitFor(() => screen.queryByRole("button", { name: "%%reloadPageLabel%%" }) !== null);
  summaryImport.failNext = false;
});

test("the search field shows every letter at once, and the list keeps only the matching tasks", async () => {
  showApp();
  await waitFor(() => titles().length === 2);
  const field = screen.getByLabelText("%%searchLabel%%") as HTMLInputElement;
  await user.type(field, "%%fixture2Name%%");
  expect(field.value, "the field").toBe("%%fixture2Name%%");
  await waitFor(() => titles().length === 1 && titles()[0] === "%%fixture2Name%%");
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
