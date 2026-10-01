// The state of the save button that the page shows.
const state = { saving: false, message: "" };
const MESSAGES = { saved: "%%saved%%", full: "%%full%%" };

// Another valid way: an unknown error goes further wrapped, with the original as its cause.
function saveTask(task, store) {
  try {
    state.saving = true;
    store(task);
  } catch (error) {
    if (error.name !== "RangeError") {
      throw new Error("the task was not saved", { cause: error });
    }
    state.message = MESSAGES.full;
    return false;
  } finally {
    state.saving = false;
  }
  state.message = MESSAGES.saved;
  return true;
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

for (const title of ["%%water%%", "%%books%%", "%%grandma%%", "%%dentist%%"]) {
  const ok = saveTask({ title: title }, storeInPlanner);
  console.log(title + " → " + ok + " · " + state.message);
}
