// The storage code of the planner app. Every key the app keeps is written here.
const TASKS_KEY = "jsll.planner.v1";
const FILTER_KEY = "jsll.planner.filter";
const DRAFT_KEY = "jsll.planner.draft";

// All tasks, so that they survive a reload and a restart of the browser.
export function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify({ schemaVersion: 1, records: tasks }));
}

// The status filter the person chose last: "pending" or "done".
export function saveFilter(filter) {
  localStorage.setItem(FILTER_KEY, filter);
}

// The text typed into the "new task" field, so that reloading this tab does not lose it.
export function saveDraft(text) {
  sessionStorage.setItem(DRAFT_KEY, text);
}
