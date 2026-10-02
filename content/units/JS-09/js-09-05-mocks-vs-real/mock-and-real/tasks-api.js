// Loads the planner's tasks from the lab server. A test may pass its own fetchFn instead of fetch.
export async function loadTasks(fetchFn = fetch) {
  const response = await fetchFn("/lab/planner/items?lang=%%lang%%");
  if (!response.ok) {
    return { state: "error", status: response.status };
  }
  const data = await response.json();
  const tasks = data.items.map((item) => ({ id: item.id, title: item.title, done: item.done }));
  return { state: "ready", tasks };
}
