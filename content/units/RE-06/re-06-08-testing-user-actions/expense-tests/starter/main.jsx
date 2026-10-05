// Runs the tests from ExpenseBoard.test.jsx and prints one line per test.
import "./fakeServer.js";
import { resetServer } from "./fakeServer.js";
import "./ExpenseBoard.test.jsx";
import { run } from "./testing.js";

await run({ beforeEach: resetServer });
