import { createRoot } from "react-dom/client";
import { WishList } from "./WishList";
import { wishes } from "./wishes.js";

// The data lives here. After every change we hand the new array to React again;
// in the next unit a component will do this itself with state.
let shown = wishes;
const root = createRoot(document.getElementById("root"));
function show() {
  root.render(<WishList wishes={shown} />);
}
show();

// One delegated listener for every button, as in the DOM unit.
document.getElementById("root").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.action === "reverse") shown = shown.toReversed();
  if (button.dataset.action === "delete") shown = shown.filter((wish) => wish.id !== button.dataset.id);
  show();
});
