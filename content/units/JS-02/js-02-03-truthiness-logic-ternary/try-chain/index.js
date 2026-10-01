// Show a task if it is not done and it is either important or due today.
const done = true;
const highPriority = false;
const dueToday = true;

const show = !done && highPriority || dueToday;
console.log("%%show%%", show);
