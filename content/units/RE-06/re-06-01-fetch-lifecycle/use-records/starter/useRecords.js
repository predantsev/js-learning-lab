import { fetchTasks } from "./fixtureApi.js";

// Loads the tasks and describes the request:
// status: "loading" | "success" | "error", records: the tasks (an array), error: an Error or null.
export function useRecords() {
  // TODO: load the tasks with fetchTasks() after the first commit.
  return { status: "loading", records: [], error: null };
}
