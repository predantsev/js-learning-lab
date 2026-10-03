import { createRoot } from "react-dom/client";
import { HabitBoard } from "./HabitBoard";
import { habits } from "./habits.js";
import { watchCommits } from "./dom-log.js";

const container = document.getElementById("root");
watchCommits(container);
const root = createRoot(container);
let shown = habits;
function show() {
  root.render(
    <>
      <p data-newest>%%newest%%: {shown.at(-1)?.name}</p>
      <button type="button">%%again%%</button>
      <HabitBoard habits={shown} />
    </>,
  );
}
show();

container.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.id) shown = shown.filter((habit) => habit.id !== button.dataset.id);
  console.log(`--- ${button.textContent}`);
  show();
});
