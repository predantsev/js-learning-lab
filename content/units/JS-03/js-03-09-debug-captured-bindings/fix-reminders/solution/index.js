import { later, runLater, taskAt } from "./helpers.js";

// 1. One reminder per task, shown later. Each reminder must name its own task.
for (let i = 0; i < 3; i++) {
  const task = taskAt(i); // a new task binding in every pass of the loop
  later(() => console.log("%%reminder%%" + task.title));
}

// 2. A card title that must always show the task's CURRENT title.
function makeCardTitle(record) {
  return () => "%%cardPrefix%%" + record.title; // read the title when the card is shown
}

const wardrobe = { id: "t-06", title: "%%tidy%%", done: true };
const wardrobeCardTitle = makeCardTitle(wardrobe);
wardrobe.title = "%%tidyMore%%"; // the task was renamed after the card was made

runLater();
console.log(wardrobeCardTitle());
