import { saveTasks, saveFilter, saveDraft } from "./planner.js";

// Every key the planner keeps in the browser (read planner.js): one entry per key.
//   storage:  "localStorage" | "sessionStorage"
//   holds:    what is stored under the key
//   why:      what the app needs it for
//   lifetime: how long it stays
const STORAGE_INVENTORY = [
  // { key: "…", storage: "…", holds: "…", why: "…", lifetime: "…" },
];

// Removes exactly the planner's keys from the storage each one lives in, and nothing else:
// other apps opened at the same address keep their data.
function clearAll() {
  // your code here
}

document.querySelector("#clear").addEventListener("click", () => {
  clearAll();
  document.querySelector("#status").textContent = "%%cleared%%";
});

// The app at work: it saves tasks, a filter and a draft.
saveTasks([{ id: "t-01", title: "%%waterPlants%%", dueDate: "2026-03-02", done: false, priority: "normal" }]);
saveFilter("pending");
saveDraft("%%draft%%");
