import { test, expect, render, screen, user, sleep } from "./testing.js";
import { settings } from "./fakeServer.js";
import TaskAdder from "./TaskAdder";

test("%%testAdd%%", async () => {
  render(<TaskAdder />);
  await user.type(screen.getByLabelText("%%titleField%%"), "%%dentist%%");
  await user.click(screen.getByRole("button", { name: "%%add%%" }));

  await sleep(200); // wait "long enough" for the server
  expect(screen.queryByText("%%dentist%%") !== null, "%%mInList%%").toBe(true);
});
