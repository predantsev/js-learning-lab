// The threat model of the lab notes service: one row per threat.
//   asset      — what is worth protecting
//   threat     — what could go wrong, in a sentence
//   entryPoint — where it enters: one of ENTRY_POINTS in model.js
//   control    — what answers it: one of CONTROLS in model.js
//   proof      — the name of a check in PROOFS (model.js) that shows the control holds
export const threats = [
  {
    asset: "%%assetAccounts%%",
    threat: "%%threatGuessing%%",
    entryPoint: 'login-form',
    control: 'rate-limit',
    proof: 'brute-force-gets-429',
  },
  {
    asset: "%%assetNotes%%",
    threat: "%%threatCurl%%",
    entryPoint: 'non-browser-client',
    control: 'session-check',
    proof: 'no-session-gets-401',
  },
  {
    asset: "%%assetNotes%%",
    threat: "%%threatForeignId%%",
    entryPoint: 'note-url',
    control: 'ownership-scope',
    proof: 'foreign-note-gets-404',
  },
  {
    asset: "%%assetNotes%%",
    threat: "%%threatForgedPost%%",
    entryPoint: 'browser-page',
    control: 'origin-check',
    proof: 'foreign-origin-post-gets-403',
  },
  {
    asset: "%%assetKey%%",
    threat: "%%threatWeakKey%%",
    entryPoint: 'config',
    control: 'secret-from-env',
    proof: 'weak-secret-refuses-start',
  },
  {
    asset: "%%assetServer%%",
    threat: "%%threatHugeBody%%",
    entryPoint: 'login-form',
    control: 'body-limit',
    proof: 'oversized-login-gets-413',
  },
];
