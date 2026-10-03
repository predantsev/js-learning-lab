// Runs the tests from WishBoard.test.jsx and prints one line per test.
import "./fakeServer.js";
import { resetServer } from "./fakeServer.js";
import "./WishBoard.test.jsx";
import { run } from "./testing.js";

await run({ beforeEach: resetServer });
