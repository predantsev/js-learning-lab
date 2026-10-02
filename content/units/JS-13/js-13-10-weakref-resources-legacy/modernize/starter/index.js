// Read-only demo: it uses budget.js as an ES module.
import * as budget from "./budget.js";

console.log(budget.sum(84550, 52000, 18000));
console.log(budget.formatTotal(84550, 52000, 18000));
console.log(budget.format(9990));
