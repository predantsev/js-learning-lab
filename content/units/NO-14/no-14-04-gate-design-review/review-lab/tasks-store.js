// An in-memory task store for the lab (read-only). createStore(tasks) → { get, put, all }.
// get returns a copy, so a change is stored only through put.
export function createStore(tasks) {
  const byId = new Map(tasks.map((task) => [task.id, structuredClone(task)]));
  return {
    get: (id) => (byId.has(id) ? structuredClone(byId.get(id)) : undefined),
    put: (task) => byId.set(task.id, structuredClone(task)),
    all: () => [...byId.values()].map((task) => structuredClone(task)),
  };
}
