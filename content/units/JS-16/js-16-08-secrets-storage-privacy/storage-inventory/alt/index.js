import { saveTasks, saveFilter, saveDraft } from "./planner.js";

// Every key the planner keeps in the browser (read planner.js): one entry per key.
//   storage:  "localStorage" | "sessionStorage"
//   holds:    what is stored under the key
//   why:      what the app needs it for
//   lifetime: how long it stays
const STORAGE_INVENTORY = [
  { key: "jsll.planner.v1", storage: "localStorage", holds: "all tasks with their schema version", why: "the list must survive a reload and a browser restart", lifetime: "no end date: until removed" },
  { key: "jsll.planner.filter", storage: "localStorage", holds: "the last chosen status filter", why: "to open the list the way the person left it", lifetime: "no end date: until removed" },
  { key: "jsll.planner.draft", storage: "sessionStorage", holds: "the unsent text of the new-task field", why: "a reload of the tab must not lose typing", lifetime: "this tab only, gone when it closes" },
];

// Removes exactly the planner's keys from the storage each one lives in, and nothing else:
// other apps opened at the same address keep their data.
function clearAll() {
  localStorage.removeItem("jsll.planner.v1");
  localStorage.removeItem("jsll.planner.filter");
  sessionStorage.removeItem("jsll.planner.draft");
}

document.querySelector("#clear").addEventListener("click", () => {
  clearAll();
  document.querySelector("#status").textContent = "%%cleared%%";
});

// The app at work: it saves tasks, a filter and a draft.
saveTasks([{ id: "t-01", title: "%%waterPlants%%", dueDate: "2026-03-02", done: false, priority: "normal" }]);
saveFilter("pending");
saveDraft("%%draft%%");
