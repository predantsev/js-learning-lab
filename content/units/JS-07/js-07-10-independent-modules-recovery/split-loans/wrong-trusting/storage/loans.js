// Saving and loading. Export by name:
// - loadLoans(storage): { ok: true, loans } or { ok: false, reason }, where reason is
//   "missing" (nothing saved), "unparsable" (not JSON), "wrong-version" (not
//   { schemaVersion: 1, records: array }) or "invalid-record" (a loan fails validateLoan).
//   For the last three it first copies the saved text under "jsll.loans.v1.backup".
//   It never changes the text saved under "jsll.loans.v1".
// - saveLoans(storage, loans): saves { schemaVersion: 1, records: loans } under "jsll.loans.v1".
import { validateLoan } from "../domain/loans.js";

const KEY = "jsll.loans.v1";
const BACKUP_KEY = "jsll.loans.v1.backup";

export function loadLoans(storage) {
  const text = storage.getItem(KEY);
  if (text === null) {
    return { ok: false, reason: "missing" };
  }
  const fail = (reason) => {
    storage.setItem(BACKUP_KEY, text);
    return { ok: false, reason: reason };
  };
  let saved;
  try {
    saved = JSON.parse(text);
  } catch (error) {
    return fail("unparsable");
  }
  if (saved?.schemaVersion !== 1 || !Array.isArray(saved.records)) {
    return fail("wrong-version");
  }
  return { ok: true, loans: saved.records };
}

export function saveLoans(storage, loans) {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: loans }));
}
