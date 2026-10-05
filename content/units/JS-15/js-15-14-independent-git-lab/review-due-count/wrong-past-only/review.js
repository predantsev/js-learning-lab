// Mistake: only past due dates, where both versions agree, and an approval.
export const review = {
  failingTasks: [{ title: "Pay the internet bill", done: false, dueDate: "2026-02-27" }],
  today: "2026-03-01",
  expected: 1,
  defectComment: "Checked 2026-02-27, works.",
  question: "Could the loop use for...of everywhere?",
  decision: "approve",
  reason: "A loop is easier to read than filter.",
};
