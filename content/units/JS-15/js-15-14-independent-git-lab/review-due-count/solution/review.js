// Your review of the pull request. Fill in every field.
export const review = {
  failingTasks: [{ title: "Return library books", done: false, dueDate: "2026-03-01" }],
  today: "2026-03-01",
  expected: 1,
  defectComment: "A task due on 2026-03-01 is not counted when today is 2026-03-01: the new loop uses < instead of <=, so tasks due today drop out.",
  question: "Was excluding tasks due today intended, or only the loop refactor?",
  decision: "request-changes",
  reason: "The count is wrong on the boundary day, and the planner shows it every day, so it must be fixed before merging.",
};
