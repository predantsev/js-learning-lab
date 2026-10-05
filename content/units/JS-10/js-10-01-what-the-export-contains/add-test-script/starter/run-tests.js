// Runs the tests from domain/habits.test.js and prints one line per test.
// The test file only registers its tests; they run when run() is called here.
import "./domain/habits.test.js";
import { run } from "./testing.js";

await run();
