// Runs the tests from TaskAdder.test.jsx and prints one line per test.
import "./fakeServer.js";
import { resetServer } from "./fakeServer.js";
import "./TaskAdder.test.jsx";
import { run } from "./testing.js";

await run({ beforeEach: resetServer });
