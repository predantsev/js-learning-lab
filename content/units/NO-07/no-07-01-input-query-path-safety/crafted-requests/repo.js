// The tasks repository. It trusts its arguments: checking them is the job of the server's edge.
const tasks = [
  { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', priority: 'normal' },
  { id: 't-02', title: '%%books%%', dueDate: '2026-03-01', priority: 'high' },
  { id: 't-05', title: '%%dentist%%', dueDate: '2026-03-10', priority: 'normal' },
];

const SORTERS = {
  title: (a, b) => a.title.localeCompare(b.title, 'en'),
  dueDate: (a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0),
  priority: (a, b) => a.priority.localeCompare(b.priority, 'en'),
};

export function createTaskRepo() {
  const repo = {
    calls: 0, // how many times the server reached the repository
    async list({ limit, sort }) {
      repo.calls += 1;
      return tasks.toSorted(SORTERS[sort]).slice(0, limit).map((task) => task.title);
    },
  };
  return repo;
}
