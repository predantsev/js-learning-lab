export const tasks = [
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02" },
  { id: "t-02", title: "%%books%%", dueDate: "2026-03-01" },
  { id: "t-03", title: "%%grandma%%", dueDate: null },
  { id: "t-05", title: "%%dentist%%", dueDate: "2026-03-10" },
];

// Earlier due dates first; tasks without a due date go last.
export function compareByDueDate(a, b) {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}
