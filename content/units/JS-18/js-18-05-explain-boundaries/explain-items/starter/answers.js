// For every boundary: `outcome` — exactly one of the values listed above it,
// `reason` — at least two sentences that justify it and name the code word in brackets.

export const answers = {
  // [fetch] "test-passes-app-breaks" | "test-fails-app-breaks" | "both-pass"
  mock: { outcome: "", reason: "" },

  // [let] "undefined-then-ReferenceError" | "ReferenceError-on-first-line" | "undefined-twice" | "5-then-3"
  tdz: { outcome: "", reason: "" },

  // [require] "1-then-0" | "1-then-1" | "0-then-0" | "0-then-1"
  modules: { outcome: "", reason: "" },

  // [localStorage] "cookie-only" | "storage-only" | "both" | "neither"
  storage: { outcome: "", reason: "" },

  // [Access-Control-Allow-Origin] "server-handles-page-cannot-read" | "browser-never-sends" | "server-refuses"
  cors: { outcome: "", reason: "" },

  // [FinalizationRegistry] "maybe-later-or-never" | "right-after-dropped" | "before-dropped"
  finalizer: { outcome: "", reason: "" },
};
