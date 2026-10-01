import { later, runLater, taskAt } from "./helpers.js";

// var i may stay: the reminders read task, and let task is a new binding in every pass.
for (var i = 0; i < 3; i++) {
  let task = taskAt(i);
  later(() => console.log("%%reminder%%" + task.title));
}

function makeCardTitle(record) {
  return () => {
    return "%%cardPrefix%%" + record.title;
  };
}

const wardrobe = { id: "t-06", title: "%%tidy%%", done: true };
const wardrobeCardTitle = makeCardTitle(wardrobe);
wardrobe.title = "%%tidyMore%%"; // the task was renamed after the card was made

runLater();
console.log(wardrobeCardTitle());
