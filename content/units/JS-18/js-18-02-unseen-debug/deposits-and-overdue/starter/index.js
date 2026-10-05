// The library's morning report. Read-only: it prints what lending.js returns,
// then runs your tests from lending.test.js.
import { heldDepositsMinor, overdueLoans } from "./lending.js";
import { LOANS, TODAY } from "./loans.js";
import { run } from "./testing.js";
import "./lending.test.js";

const held = heldDepositsMinor(LOANS);
console.log(`%%heldLine%% ${Math.trunc(held / 100)}.${String(held % 100).padStart(2, "0")} %%uah%%`);
console.log(`%%overdueLine%% ${overdueLoans(LOANS, TODAY).map((loan) => loan.tool).join(", ")}`);
await run();
