// For every boundary: `outcome` — exactly one of the values listed above it,
// `reason` — at least two sentences that justify it and name the code word in brackets.

export const answers = {
  // [fetch] "test-passes-app-breaks" | "test-fails-app-breaks" | "both-pass"
  mock: {
    outcome: "test-passes-app-breaks",
    reason: "The test replaces fetch with mockFetch, so it receives the old array shape that its author wrote, whatever the server does now. The real app calls the real fetch, gets { rooms: [...] } instead of an array, and the list breaks.",
  },

  // [let] "undefined-then-ReferenceError" | "ReferenceError-on-first-line" | "undefined-twice" | "5-then-3"
  tdz: {
    outcome: "undefined-then-ReferenceError",
    reason: "A var declaration is created with the value undefined before the file runs, so the first log prints undefined. A let variable also exists from the start but stays in the temporal dead zone until its line runs, so reading limit earlier throws a ReferenceError.",
  },

  // [require] "1-then-0" | "1-then-1" | "0-then-0" | "0-then-1"
  modules: {
    outcome: "1-then-1",
    reason: "An ES module import is a live binding to the exporting module's variable, so after increment() main.mjs reads the new value 1. In CommonJS require returns the exports object, and destructuring copies count at that moment, so main.cjs still prints 0.",
  },

  // [localStorage] "cookie-only" | "storage-only" | "both" | "neither"
  storage: {
    outcome: "cookie-only",
    reason: "localStorage belongs to an origin, and http://localhost:5173 and http://localhost:8080 are different origins because the ports differ. A host-only cookie is scoped by host and path but not by port, so the browser sends it to localhost:8080 as well.",
  },

  // [Access-Control-Allow-Origin] "server-handles-page-cannot-read" | "browser-never-sends" | "server-refuses"
  cors: {
    outcome: "server-handles-page-cannot-read",
    reason: "The browser sends this simple POST without a preflight, and the server receives and processes it. Without Access-Control-Allow-Origin the browser only hides the response from the page's script, so CORS protects the reader in the browser, not the server: the server must check the request itself.",
  },

  // [FinalizationRegistry] "maybe-later-or-never" | "right-after-dropped" | "before-dropped"
  finalizer: {
    outcome: "maybe-later-or-never",
    reason: "Setting draft to null only makes the object unreachable; the garbage collector decides if and when to collect it. A FinalizationRegistry callback may run much later or never, so correct cleanup must not depend on it and uses try/finally or an explicit close instead.",
  },
};
