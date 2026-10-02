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
function classifyFailure(outcome) {
  // your code here
}

// Writes into #status: for a failure its message from MESSAGES (for "http-error" followed by the
// status in brackets, for example "… (404)"); for a success "%%loaded%% N", where N is data.items.length.
function showOutcome(outcome) {
  // your code here
}

showOutcome(await attempt("/lab/habits/items?lang=%%lang%%", { signal: AbortSignal.timeout(2000) }));
