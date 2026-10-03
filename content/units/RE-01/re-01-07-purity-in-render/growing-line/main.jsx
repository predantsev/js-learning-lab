import { createRoot } from "react-dom/client";
import { WantedLine } from "./WantedLine";
import { wishes } from "./wishes.js";

const root = createRoot(document.getElementById("root"));
let renders = 0;
function show() {
  renders += 1;
  console.log(`--- root.render #${renders}, the same wishes`);
  root.render(
    <>
      <button type="button">%%again%%</button>
      <WantedLine wishes={wishes} />
    </>,
  );
}
show();

// The button triggers a re-render with exactly the same data.
document.getElementById("root").addEventListener("click", (event) => {
  if (event.target.closest("button")) show();
});
