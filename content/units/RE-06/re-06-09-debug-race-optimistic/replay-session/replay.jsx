// Replays a session recorded on a slow evening: fast typing, then a tick while the server is busy.
// It uses the course test tools to act like the person did, and prints what was on the screen.
import { render, screen, user } from "./testing.js";
import { settings, whenIdle } from "./fakeServer.js";
import WishBoard from "./WishBoard";

const rows = () => screen.queryAllByRole("listitem").map((item) => item.textContent.trim());
const checkboxOf = (name) => screen.queryAllByRole("listitem").find((item) => item.textContent.trim() === name).querySelector("input");

export async function replay() {
  render(<WishBoard />);
  await whenIdle();

  console.log("— %%stepType%%");
  await user.type(screen.getByLabelText("%%searchLabel%%"), "%%query%%");
  await whenIdle();
  console.log(`%%screenWord%% ${rows().join(" · ")}`);

  console.log("— %%stepTick%%");
  settings.failNext = 2; // the server answers 503 to the next two changes
  await user.click(checkboxOf("%%lamp%%"));
  console.log(`%%screenWord%% %%lamp%% ${checkboxOf("%%lamp%%").checked ? "☑" : "☐"}`);
  await whenIdle();
  console.log(`%%screenWord%% %%lamp%% ${checkboxOf("%%lamp%%").checked ? "☑" : "☐"} · ${screen.getByRole("status").textContent || "%%noMessage%%"}`);
}
