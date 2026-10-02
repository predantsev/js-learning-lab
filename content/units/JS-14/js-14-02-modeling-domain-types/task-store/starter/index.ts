// TODO 1: a type alias TaskRecord for one task:
//   id (text that must never change), title (text),
//   dueDate (text or null), done (true/false).
// TODO 2: an interface TaskStore with three methods:
//   list() gives all tasks, get(id) gives one task or undefined,
//   save(task) stores a task and gives nothing back.
// TODO 3: annotate createMemoryStore: its parameter and its result.

function createMemoryStore(initial) {
  let tasks = [...initial];
  return {
    lsit() {
      return [...tasks];
    },
    get(id) {
      return tasks.find((task) => task.id === id);
    },
    save(task) {
      tasks = [...tasks.filter((saved) => saved.id !== task.id), task];
    },
  };
}

const store = createMemoryStore([
  { id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: false },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false },
]);

store.save({ id: "t-01", title: "%%water%%", dueDate: "2026-03-02", done: true });
console.log(store.list().map((task) => `${task.id} ${task.done}`).join(", "));
