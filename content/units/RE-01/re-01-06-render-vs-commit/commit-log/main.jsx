import { createRoot } from "react-dom/client";
import { App } from "./App";
import { before, after } from "./fixtures.js";
import { watchCommits } from "./dom-log.js";

const container = document.getElementById("root");
watchCommits(container);
const root = createRoot(container);
let version = 0;
function show() {
  console.log(`--- root.render, version ${version}`);
  root.render(<App records={version === 0 ? before : after} />);
}
show();

container.addEventListener("click", (event) => {
  if (event.target.closest("button")?.dataset.action !== "next") return;
  version = 1;
  show();
});
