// Saving and loading. Export by name:
// - loadLoans(storage): { ok: true, loans } or { ok: false, reason }, where reason is
//   "missing" (nothing saved), "unparsable" (not JSON), "wrong-version" (not
//   { schemaVersion: 1, records: array }) or "invalid-record" (a loan fails validateLoan).
//   For the last three it first copies the saved text under "jsll.loans.v1.backup".
//   It never changes the text saved under "jsll.loans.v1".
// - saveLoans(storage, loans): saves { schemaVersion: 1, records: loans } under "jsll.loans.v1".
