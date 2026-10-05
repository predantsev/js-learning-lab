import { test, expect, render, screen, within, user, waitFor } from "./testing.js";
import { settings, resetServer, whenIdle } from "./fakeServer.js";
import Bookmarks from "./Bookmarks";

const rows = () => screen.queryAllByRole("listitem");
const row = (title) => rows().find((item) => item.textContent.includes(title));

test("%%testLoad%%", async () => {
  render(<Bookmarks />);
  await waitFor(() => rows().length === 2);
  expect(within(row("%%bus%%")).getByText("%%bus%%").getAttribute("href"), "%%mHref%%").toBe("https://example.com/bus");
});

test("%%testEmpty%%", async () => {
  resetServer([]);
  render(<Bookmarks />);
  await screen.findByText("%%empty%%");
});

test("%%testCreate%%", async () => {
  render(<Bookmarks />);
  await waitFor(() => rows().length === 2);
  await user.type(screen.getByLabelText("%%titleField%%"), "%%course%%");
  await user.type(screen.getByLabelText("%%urlField%%"), "https://example.com/js-course");
  await user.click(screen.getByRole("button", { name: "%%add%%" }));
  await waitFor(() => rows().length === 3);
  expect(row("%%course%%") !== undefined, "%%mTitles%%").toBe(true);
});

test("%%testFailedUpdate%%", async () => {
  render(<Bookmarks />);
  await waitFor(() => rows().length === 2);
  settings.failNextWrite = 1;
  await user.click(within(row("%%bus%%")).getByRole("button", { name: "%%favorite%%" }));
  await whenIdle();
  expect(screen.getByRole("alert").textContent, "%%mAlert%%").toBe("%%saveFailed%%");
  expect(within(row("%%bus%%")).getByRole("button", { name: "%%favorite%%" }).getAttribute("aria-pressed"), "%%mPressed%%").toBe("true");
});

test("%%testRemove%%", async () => {
  render(<Bookmarks />);
  await waitFor(() => rows().length === 2);
  await user.click(within(row("%%borshch%%")).getByRole("button", { name: "%%remove%%" }));
  await waitFor(() => rows().length === 1);
  expect(row("%%borshch%%"), "%%mTitles%%").toBe(undefined);
});
