import { test, expect, render, screen, within, user } from "./testing.js";
import { settings, whenIdle } from "./fakeServer.js";
import Bookmarks from "./Bookmarks";

// Every bookmark is found the way a screen reader finds it: a link with its title as the name.
const linkTitles = () => screen.queryAllByRole("link").map((link) => link.textContent);
const rowOfLink = (title) => screen.getByRole("link", { name: title }).closest("li");

test("%%testLoad%%", async () => {
  render(<Bookmarks />);
  const bus = await screen.findByRole("link", { name: "%%bus%%" });
  expect(bus.getAttribute("href"), "%%mHref%%").toBe("https://example.com/bus");
  expect(linkTitles(), "%%mTitles%%").toEqual(["%%borshch%%", "%%bus%%"]);
});

test("%%testCreate%%", async () => {
  render(<Bookmarks />);
  await screen.findByRole("link", { name: "%%borshch%%" });
  await user.type(screen.getByLabelText("%%titleField%%"), "%%course%%");
  await user.type(screen.getByLabelText("%%urlField%%"), "https://example.com/js-course");
  await user.click(screen.getByRole("button", { name: "%%add%%" }));
  await screen.findByRole("link", { name: "%%course%%" });
  expect(linkTitles(), "%%mTitles%%").toEqual(["%%borshch%%", "%%bus%%", "%%course%%"]);
});

test("%%testFailedUpdate%%", async () => {
  render(<Bookmarks />);
  await screen.findByRole("link", { name: "%%bus%%" });
  settings.failNextWrite = 1;
  await user.click(within(rowOfLink("%%bus%%")).getByRole("button", { name: "%%favorite%%" }));
  await screen.findByText("%%saveFailed%%");
  await whenIdle();
  const pressed = within(rowOfLink("%%bus%%")).getByRole("button", { name: "%%favorite%%" }).getAttribute("aria-pressed");
  expect(pressed, "%%mPressed%%").toBe("true");
});

test("%%testRemove%%", async () => {
  render(<Bookmarks />);
  await screen.findByRole("link", { name: "%%borshch%%" });
  await user.click(within(rowOfLink("%%borshch%%")).getByRole("button", { name: "%%remove%%" }));
  await whenIdle();
  expect(linkTitles(), "%%mTitles%%").toEqual(["%%bus%%"]);
});
