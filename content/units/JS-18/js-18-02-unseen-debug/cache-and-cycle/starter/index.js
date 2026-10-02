// The tool library's daily report. Read-only: it shows what the modules return.
import { TOOLS, describeTool } from "./catalog.js";
import { feeFor } from "./fees.js";
import { freeUnits, stats } from "./availability.js";

for (const tool of TOOLS) console.log(describeTool(tool.id));
console.log(`%%feeLine%% ${feeFor("ladder", 3)}`);

// The screen asks the same questions again and again while the page is scrolled.
const day = "2026-03-10";
for (let round = 0; round < 3; round++) {
  for (const tool of TOOLS) freeUnits(tool.id, day);
}
console.log(`%%freeLine%% ${TOOLS.map((tool) => freeUnits(tool.id, day)).join(", ")}`);
console.log(`%%computedLine%% ${stats.computed}`);
