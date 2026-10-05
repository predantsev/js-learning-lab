// Loading the starting tasks from the project file data/tasks.json through fetch.
import { isUsableTask } from "../storage/tasks.js";

// A fetch address is resolved from the page (index.html), not from this module, so it starts at
// the project folder.
const FILE = "./data/tasks.json";

// Fetches the starting tasks and returns (a promise of) their checked list.
// - An answer that is not ok rejects with an Error whose `status` property is the status code.
// - An answer that is not JSON, is not { schemaVersion: 1, records: array } or has a damaged
//   record rejects with an Error: the file is damaged.
// - A network failure and an abort through `signal` reject as fetch rejects (TypeError, AbortError).
export async function loadFixtures(signal) {
  const response = await fetch(FILE, { signal: signal });
  if (!response.ok) {
    const error = new Error("HTTP " + response.status + " for " + FILE);
    error.status = response.status;
    throw error;
  }
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    throw new Error("Expected JSON from " + FILE + ", got " + type);
  }
  const body = await response.json();
  if (body?.schemaVersion !== 1 || !Array.isArray(body.records) || !body.records.every(isUsableTask)) {
    throw new Error("The starting tasks in " + FILE + " are damaged");
  }
  return body.records;
}
