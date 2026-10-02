type TaskRecord = {
  readonly id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
};

interface TaskStore {
  list(): TaskRecord[];
  get(id: string): TaskRecord | undefined;
  save(task: TaskRecord): void;
}

function createMemoryStore(initial: TaskRecord[]) {
  let tasks = [...initial];
  return {
    lsit() {
      return [...tasks];
    },
    get(id: string) {
      return tasks.find((task) => task.id === id);
    },
    save(task: TaskRecord) {
      tasks = [...tasks.filter((saved) => saved.id !== task.id), task];
    },
  };
}

const store = createMemoryStore([
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: false },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false },
]);

store.save({ id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: true });
console.log(store.lsit().map((task) => `${task.id} ${task.done}`).join(", "));
