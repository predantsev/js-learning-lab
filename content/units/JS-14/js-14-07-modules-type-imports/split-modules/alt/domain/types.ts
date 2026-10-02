// Types of the planner domain: Priority and Task.
export type Priority = "low" | "normal" | "high";

export interface Task {
  readonly id: string;
  title: string;
  priority: Priority;
  done: boolean;
}
