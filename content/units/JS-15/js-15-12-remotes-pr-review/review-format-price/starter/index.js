// Runs both versions of formatPrice side by side (read-only).
import { formatPrice as before } from "./before.js";
import { formatPrice as after } from "./after.js";
import { review } from "./review.js";

for (const amount of [157600, 84550, review.failingInput]) {
  console.log(`${amount}: before "${before(amount)}", after "${after(amount)}"`);
}
console.log(`decision: ${review.decision}`);
