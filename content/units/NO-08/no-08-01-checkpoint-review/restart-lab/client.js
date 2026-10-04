// The planner lab's client adapter: what a web page would use. It keeps the list it shows in
// `tasks` (its cache). A task the server did not confirm stays in the cache marked saved: false.
export function createClient(base) {
  const tasks = [];
  return {
    tasks,
    async load() {
      const response = await fetch(`${base}/tasks`, { signal: AbortSignal.timeout(2000) });
      tasks.splice(0, tasks.length, ...(await response.json()).map((task) => ({ ...task, saved: true })));
    },
    async create(title) {
      try {
        const response = await fetch(`${base}/tasks`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title }),
          signal: AbortSignal.timeout(2000),
        });
        if (response.status === 201) return tasks.push({ ...(await response.json()), saved: true });
        tasks.push({ title, saved: false });
      } catch {
        // No answer at all (the server is down): show the task, but as not saved.
        tasks.push({ title, saved: false });
      }
    },
  };
}
