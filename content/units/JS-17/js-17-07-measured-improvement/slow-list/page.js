// A planner list: TASK_COUNT synthetic tasks over 30 due dates, in PROJECT_COUNT projects.
const TASK_COUNT = 5000;
const PROJECT_COUNT = 2000;

const projects = Array.from({ length: PROJECT_COUNT }, (_, i) => ({ id: "p-" + i, name: "%%project%% " + (i + 1) }));
const tasks = Array.from({ length: TASK_COUNT }, (_, i) => ({
  id: "t-" + i,
  title: "%%task%% " + (i + 1),
  dueDate: "2026-03-" + String(1 + (i % 30)).padStart(2, "0"),
  projectId: "p-" + ((i * 7) % PROJECT_COUNT),
}));

// Candidate A: the due date is formatted again for every row.
function formatDue(isoDate) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("%%locale%%", { weekday: "short", day: "numeric", month: "short" });
}

// Candidate B: the project is looked up with find for every row.
function projectName(task) {
  return projects.find((project) => project.id === task.projectId).name;
}

// Candidate C: every row is appended to the page separately.
function renderTasks(list) {
  const container = document.querySelector("#tasks");
  container.replaceChildren();
  for (const task of list) {
    const item = document.createElement("li");
    item.textContent = `${task.title} · ${projectName(task)} · ${formatDue(task.dueDate)}`;
    container.append(item);
  }
}

// Renders five times and reports the median time with the dataset size.
document.querySelector("#measure").addEventListener("click", () => {
  const times = [];
  for (let run = 0; run < 5; run++) {
    const start = performance.now();
    renderTasks(tasks);
    times.push(performance.now() - start);
  }
  const median = times.toSorted((a, b) => a - b)[2];
  const text = `${TASK_COUNT} %%tasks%%, ${PROJECT_COUNT} %%projects%%: %%median%% ${median.toFixed(0)} ms`;
  document.querySelector("#status").textContent = text;
  console.log(text);
});

renderTasks(tasks);
