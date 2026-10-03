// The app's entry: StrictMode stays on. After the app starts, the tests from
// CategoryPage.test.jsx run and print one line each.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { createMemoryHistory } from "./router";
import "./CategoryPage.test.jsx";
import { run } from "./testing.js";

const appHistory = createMemoryHistory("/expenses");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App history={appHistory} />
  </StrictMode>,
);

await run();
