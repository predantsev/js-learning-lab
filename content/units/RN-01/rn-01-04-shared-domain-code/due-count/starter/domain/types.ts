export type Task = {
  readonly id: string;
  title: string;
  dueDate: string | null; // "YYYY-MM-DD" or no due date
  done: boolean;
  priority: 'low' | 'normal' | 'high';
};
