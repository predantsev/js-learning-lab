import { test, expect, render, screen, within, user } from "./testing.js";
import { settings, whenIdle } from "./fakeServer.js";
import Bookmarks from "./Bookmarks";

const titles = () => screen.queryAllByRole("listitem").map((item) => item.querySelector("a").textContent);
const rowOf = (title) => screen.getByText(title).closest("li");

test("%%testLoad%%", async () => {
  render(<Bookmarks />);
  await screen.findByText("%%borshch%%");
  expect(titles(), "%%mTitles%%").toEqual(["%%borshch%%", "%%bus%%"]);
});

test("%%testCreate%%", async () => {
  render(<Bookmarks />);
  await screen.findByText("%%borshch%%");
  await user.type(screen.getByLabelText("%%titleField%%"), "%%course%%");
  await user.type(screen.getByLabelText("%%urlField%%"), "https://example.com/js-course");
  await user.click(screen.getByRole("button", { name: "%%add%%" }));
  await screen.findByText("%%course%%");
  expect(titles(), "%%mTitles%%").toEqual(["%%borshch%%", "%%bus%%", "%%course%%"]);
});

test("%%testRemove%%", async () => {
  render(<Bookmarks />);
  await screen.findByText("%%borshch%%");
  await user.click(within(rowOf("%%bus%%")).getByRole("button", { name: "%%remove%%" }));
  await whenIdle();
  expect(titles(), "%%mTitles%%").toEqual(["%%borshch%%"]);
});
