import { createRoot } from "react-dom/client";
import { WishBoard } from "./WishBoard";
import { wishes } from "./wishes.js";
import { watchCommits } from "./dom-log.js";

const container = document.getElementById("root");
watchCommits(container);
const root = createRoot(container);
let shown = wishes;
function show() {
  root.render(<WishBoard wishes={shown} />);
}
show();

container.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.id) shown = shown.filter((wish) => wish.id !== button.dataset.id);
  console.log(`--- ${button.textContent}`);
  show();
});
