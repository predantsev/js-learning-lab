import { attempt } from "./attempt.js";

// One message per kind of failure. Every message is different, so the person knows what to do.
const MESSAGES = {
  "http-error": "%%httpError%%",
  "network-error": "%%networkError%%",
  timeout: "%%timeout%%",
  aborted: "%%aborted%%",
  "invalid-json": "%%invalidJson%%",
};

// Returns the kind of failure of an outcome from attempt(), or null when the load succeeded:
// "http-error" | "network-error" | "timeout" | "aborted" | "invalid-json" | null
function classifyFailure({ response, error }) {
  if (response === undefined) {
    // fetch itself rejected: the error's name tells why
    if (error.name === "AbortError") return "aborted";
    if (error.name === "TimeoutError") return "timeout";
    return "network-error";
  }
  if (!response.ok) return "http-error";
  return error instanceof SyntaxError ? "invalid-json" : null;
}

// Writes into #status: for a failure its message from MESSAGES (for "http-error" followed by the
// status in brackets, for example "… (404)"); for a success "%%loaded%% N", where N is data.items.length.
function showOutcome(outcome) {
  const kind = classifyFailure(outcome);
  const text = kind === null
    ? `%%loaded%% ${outcome.data.items.length}`
    : MESSAGES[kind] + (kind === "http-error" ? ` (${outcome.response.status})` : "");
  document.querySelector("#status").textContent = text;
}

showOutcome(await attempt("/lab/habits/items?lang=%%lang%%", { signal: AbortSignal.timeout(2000) }));
