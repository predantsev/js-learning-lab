import { later, runLater, taskAt } from "./helpers.js";

// 1. One reminder per task, shown later. Each reminder must name its own task.
for (var i = 0; i < 3; i++) {
  var task = taskAt(i);
  later(() => console.log("%%reminder%%" + task.title));
}

// 2. A card title that must always show the task's CURRENT title.
function makeCardTitle(record) {
  const title = record.title;
  return () => "%%cardPrefix%%" + title;
}

const wardrobe = { id: "t-06", title: "%%tidy%%", done: true };
const wardrobeCardTitle = makeCardTitle(wardrobe);
wardrobe.title = "%%tidyMore%%"; // the task was renamed after the card was made

runLater();
console.log(wardrobeCardTitle());
