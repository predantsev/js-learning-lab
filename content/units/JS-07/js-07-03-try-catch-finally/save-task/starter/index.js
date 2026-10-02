// The state of the save button that the page shows.
const state = { saving: false, message: "" };
const MESSAGES = { saved: "%%saved%%", full: "%%full%%" };

// saveTask(task, store) saves one task with the given store function.
// - While store works, state.saving is true; afterwards it is false again, always.
// - Success: state.message becomes MESSAGES.saved, and saveTask returns true.
// - A RangeError from store means "the planner is full":
//   state.message becomes MESSAGES.full, and saveTask returns false.
// - Any other error is not saveTask's business: it must go further.
function saveTask(task, store) {
  // Write here.
}

// A ready-made store to try it out: it keeps at most 3 tasks.
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
