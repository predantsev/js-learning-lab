// Runs both versions of dueCount on your failing case (read-only).
import { dueCount as before } from "./before.js";
import { dueCount as after } from "./after.js";
import { review } from "./review.js";

console.log(`today: ${review.today}`);
for (const task of review.failingTasks) {
  console.log(`- ${task.title} | done: ${task.done} | due: ${task.dueDate}`);
}
console.log(`before: ${before(review.failingTasks, review.today)}, after: ${after(review.failingTasks, review.today)}`);
console.log(`decision: ${review.decision}`);
