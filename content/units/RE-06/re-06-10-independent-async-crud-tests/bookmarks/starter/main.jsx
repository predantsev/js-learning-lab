// Runs the tests from Bookmarks.test.jsx and prints one line per test.
import "./fakeServer.js";
import { resetServer } from "./fakeServer.js";
import "./Bookmarks.test.jsx";
import { run } from "./testing.js";

await run({ beforeEach: () => resetServer() });
