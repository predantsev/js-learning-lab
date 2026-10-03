// Runs the tests from HabitBoard.test.jsx, as the pipeline's test stage does, and prints one line
// per test. Each test renders its own HabitBoard, so the page itself stays empty.
import "./HabitBoard.test.jsx";
import { run } from "./testing.js";

await run();
