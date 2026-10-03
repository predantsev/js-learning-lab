// Shared domain code, used unchanged by the web client and the native app.
export function formatLabel(task, labels) {
  const due = task.dueDate ?? labels.noDueDate;
  return `${task.done ? '✓ ' : ''}${task.title} · ${due}`;
}
