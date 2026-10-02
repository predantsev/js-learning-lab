// A planner transform in three steps. Which one grows fastest when the data doubles?
const PROJECTS = 50;

function makeData(n) {
  const projects = Array.from({ length: PROJECTS }, (_, i) => ({ id: "p-" + i, name: "%%project%% " + i }));
  const tasks = Array.from({ length: n }, (_, i) => ({
    id: "t-" + i,
    projectId: "p-" + (i % PROJECTS),
    dueDate: "2026-03-" + String(1 + ((i * 7) % 28)).padStart(2, "0"),
  }));
  // Every tenth task waits for another one: the blocked list grows with the tasks.
  const blockedIds = tasks.filter((_, i) => i % 10 === 0).map((task) => task.id);
  return { projects, tasks, blockedIds };
}

const ops = { sort: 0, project: 0, blocked: 0 };

function planView({ projects, tasks, blockedIds }) {
  // Step 1: sort by due date.
  const sorted = tasks.toSorted((a, b) => {
    ops.sort = ops.sort + 1;
    return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
  });
  return sorted.map((task) => {
    // Step 2: find the project of the task.
    const project = projects.find((p) => {
      ops.project = ops.project + 1;
      return p.id === task.projectId;
    });
    // Step 3: is the task blocked?
    const blocked = blockedIds.some((id) => {
      ops.blocked = ops.blocked + 1;
      return id === task.id;
    });
    return { id: task.id, project: project.name, blocked };
  });
}

for (const n of [1000, 2000, 4000]) {
  ops.sort = 0;
  ops.project = 0;
  ops.blocked = 0;
  const start = performance.now();
  planView(makeData(n));
  const ms = (performance.now() - start).toFixed(1);
  console.log(`n=${n} · %%sortLabel%% ${ops.sort} · %%projectLabel%% ${ops.project} · %%blockedLabel%% ${ops.blocked} · ${ms} ms`);
}
