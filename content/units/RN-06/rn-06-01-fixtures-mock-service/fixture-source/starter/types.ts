// The planner record, as in the shared domain code.
export interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
  priority: 'low' | 'normal' | 'high';
}
