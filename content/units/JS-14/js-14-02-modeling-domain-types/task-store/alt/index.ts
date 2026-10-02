interface TaskRecord {
  readonly id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
}

type TaskStore = {
  list: () => TaskRecord[];
  get: (id: string) => TaskRecord | undefined;
  save: (task: TaskRecord) => void;
};

function createMemoryStore(initial: TaskRecord[]): TaskStore {
  const tasks = [...initial];
  return {
    list: () => [...tasks],
    get: (id) => tasks.find((task) => task.id === id),
    save: (task) => {
      const index = tasks.findIndex((saved) => saved.id === task.id);
      if (index === -1) {
        tasks.push(task);
      } else {
        tasks.splice(index, 1);
        tasks.push(task);
      }
    },
  };
}

const store = createMemoryStore([
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: false },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false },
]);

store.save({ id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: true });
console.log(store.list().map((task) => `${task.id} ${task.done}`).join(", "));
