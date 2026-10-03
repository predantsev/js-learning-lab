// The tasks and the status options. Read-only.
export type Priority = "low" | "normal" | "high";

export type Task = {
  readonly id: string;
  title: string;
  dueDate: string | null; // "YYYY-MM-DD"
  done: boolean;
  priority: Priority;
};

export type StatusOption = { id: "all" | "pending" | "done"; label: string };

export const STATUS_OPTIONS: StatusOption[] = [
  { id: "all", label: "%%all%%" },
  { id: "pending", label: "%%pending%%" },
  { id: "done", label: "%%done%%" },
];

export const TASKS: Task[] = [
  { id: "t-01", title: "%%plants%%", dueDate: "2026-03-02", done: false, priority: "normal" },
  { id: "t-02", title: "%%library%%", dueDate: "2026-03-01", done: false, priority: "high" },
  { id: "t-04", title: "%%internet%%", dueDate: "2026-02-27", done: true, priority: "high" },
  { id: "t-06", title: "%%wardrobe%%", dueDate: "2026-03-05", done: true, priority: "low" },
];

export function matchesStatus(task: Task, status: StatusOption): boolean {
  if (status.id === "all") return true;
  return status.id === "done" ? task.done : !task.done;
}
