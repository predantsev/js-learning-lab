// Mistake: the right failing case, but the expected count copied from the buggy version.
export const review = {
  failingTasks: [{ title: "Return library books", done: false, dueDate: "2026-03-01" }],
  today: "2026-03-01",
  expected: 0,
  defectComment: "For 2026-03-01 the result is 0.",
  question: "Is this the intended count?",
  decision: "request-changes",
  reason: "Something looks off on the boundary day.",
};
