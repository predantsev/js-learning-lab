import { createRoot } from "react-dom/client";
import App from "./App";
import { server, serveRelease } from "./server.js";

// The server's control panel — not part of the app. It switches which release folder is served.
function ServerPanel() {
  return (
    <aside aria-label="%%serverPanel%%">
      <p>%%serverPanel%%</p>
      <button type="button" onClick={() => serveRelease("v0.1.0")}>
        %%rollBack%%
      </button>
    </aside>
  );
}

createRoot(document.getElementById("root")).render(
  <>
    <App />
    <ServerPanel />
  </>,
);
console.log(`%%nowServing%% ${server.current}`);
