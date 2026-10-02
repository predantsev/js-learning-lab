// Keeps the tasks with the given status: "done", "pending" or "all".
export function filterByStatus(tasks, status) {
  if (status === "all") return [...tasks];
  const wantDone = status === "done";
  return tasks.filter((task) => task.done !== wantDone);
}
