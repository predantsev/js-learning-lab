// The known RangeError is rethrown too, so "the planner is full" crashes the program.
const state = { saving: false, message: "" };
const MESSAGES = { saved: "%%saved%%", full: "%%full%%" };

function saveTask(task, store) {
  state.saving = true;
  try {
    store(task);
    state.message = MESSAGES.saved;
    return true;
  } catch (error) {
    state.message = MESSAGES.full;
    throw error;
  } finally {
    state.saving = false;
  }
}

const planner = [];
function storeInPlanner(task) {
  if (typeof task.title !== "string") {
    throw new TypeError("task.title must be text, got " + task.title);
  }
  if (planner.length >= 3) {
    throw new RangeError("the planner is full: at most 3 tasks");
  }
  planner.push(task);
}

for (const title of ["%%water%%", "%%books%%", "%%grandma%%"]) {
  const ok = saveTask({ title: title }, storeInPlanner);
  console.log(title + " → " + ok + " · " + state.message);
}
