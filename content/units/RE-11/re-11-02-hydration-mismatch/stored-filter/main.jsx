import { hydrateRoot } from "react-dom/client";
import TaskFilter from "./TaskFilter";

// The visitor chose "pending" on an earlier visit; it is kept only in their browser.
if (localStorage.getItem("planner.filter") === null) localStorage.setItem("planner.filter", "pending");

const serverLabel = document.querySelector("#root b");
console.log(`%%serverShows%%: "${serverLabel.textContent}"`);

// Hydration: render the same tree and attach to the HTML that is already on the page.
hydrateRoot(document.getElementById("root"), <TaskFilter />);

setTimeout(() => {
  console.log(`%%sameNode%%: ${serverLabel.isConnected}`);
}, 500);
