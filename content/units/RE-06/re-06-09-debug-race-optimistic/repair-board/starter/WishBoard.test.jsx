import { test, expect, render, screen, user } from "./testing.js";
import { whenIdle } from "./fakeServer.js";
import WishBoard from "./WishBoard";

const rows = () => screen.queryAllByRole("listitem").map((item) => item.textContent.trim());
const checkboxOf = (name) => screen.queryAllByRole("listitem").find((item) => item.textContent.trim() === name).querySelector("input");

// Keep these two tests and add a third one that reproduces the race.

test("%%testSearch%%", async () => {
  render(<WishBoard />);
  const field = screen.getByLabelText("%%searchLabel%%");
  await user.type(field, "%%firstLetter%%");
  await whenIdle();
  await user.type(field, "%%secondLetter%%");
  await whenIdle();
  expect(rows(), "%%mRows%%").toEqual("%%hits%%".split("|"));
});

test("%%testToggle%%", async () => {
  render(<WishBoard />);
  await whenIdle();
  await user.click(checkboxOf("%%lamp%%"));
  await whenIdle();
  expect(checkboxOf("%%lamp%%").checked, "%%mChecked%%").toBe(true);
});
