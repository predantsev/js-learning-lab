// For your tests: shows the whole app at a path and returns its history,
// so a test can also move on with history.push(path).
import App from "./App";
import { createMemoryHistory } from "./router";
import { render } from "./testing.js";

export function renderApp(path) {
  const history = createMemoryHistory(path);
  render(<App history={history} />);
  return history;
}
