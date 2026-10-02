import { measure } from "./measure.js";
import { countPerDateByScan, countPerDateWithMap } from "./transforms.js";

const sizes = [1000, 10000, 50000];
for (const [label, fn] of [["%%scan%%", countPerDateByScan], ["Map:", countPerDateWithMap]]) {
  for (const row of measure(fn, sizes, 5)) {
    console.log(label, `n=${row.size}`, `${row.operations} %%ops%%`, `${row.medianMs?.toFixed(1)} ms`);
  }
}
