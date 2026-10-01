import { later, runLater, taskAt } from "./helpers.js";

// Only the counter became let; var task is still one binding for the whole loop.
for (let i = 0; i < 3; i++) {
  var task = taskAt(i);
  later(() => console.log("%%reminder%%" + task.title));
}

function makeCardTitle(record) {
  return () => "%%cardPrefix%%" + record.title;
}

const wardrobe = { id: "t-06", title: "%%tidy%%", done: true };
const wardrobeCardTitle = makeCardTitle(wardrobe);
wardrobe.title = "%%tidyMore%%"; // the task was renamed after the card was made

runLater();
console.log(wardrobeCardTitle());
