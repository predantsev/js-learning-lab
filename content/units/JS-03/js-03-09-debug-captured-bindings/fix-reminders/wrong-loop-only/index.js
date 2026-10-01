import { later, runLater, taskAt } from "./helpers.js";

for (let i = 0; i < 3; i++) {
  const task = taskAt(i);
  later(() => console.log("%%reminder%%" + task.title));
}

// The loop is fixed, but "let" cannot help here: title is still a copy made at creation time.
function makeCardTitle(record) {
  let title = record.title;
  return () => "%%cardPrefix%%" + title;
}

const wardrobe = { id: "t-06", title: "%%tidy%%", done: true };
const wardrobeCardTitle = makeCardTitle(wardrobe);
wardrobe.title = "%%tidyMore%%"; // the task was renamed after the card was made

runLater();
console.log(wardrobeCardTitle());
