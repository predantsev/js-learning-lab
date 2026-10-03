// A fake autosave service: an external system that knows when each task was last saved.
const statuses = new Map([
  ["t-01", "%%justNow%%"],
  ["t-02", "%%fiveMinutes%%"],
  ["t-03", "%%never%%"],
]);

export function readSaveStatus(taskId) {
  return statuses.get(taskId) ?? "%%unknown%%";
}

export function setSaveStatus(taskId, text) {
  statuses.set(taskId, text);
}
