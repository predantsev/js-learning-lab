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
  // TODO: at least four more rows
];
