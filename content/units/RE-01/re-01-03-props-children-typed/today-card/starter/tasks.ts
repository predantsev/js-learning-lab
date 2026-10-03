export type Task = {
  readonly id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
};

export const tasks: Task[] = [
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: false },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false },
];
