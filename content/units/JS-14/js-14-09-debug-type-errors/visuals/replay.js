function loadTasks(text) {
  return JSON.parse(text);
}

function dueMonth(task) {
  return task.dueDate.slice(0, 7);
}

const stored = '[{"id":"t-01","dueDate":"2026-03-02"},{"id":"t-03","dueDate":null}]';
const tasks = loadTasks(stored);
for (const task of tasks) {
  console.log(dueMonth(task));
}
