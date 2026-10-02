import { validateLoan } from "../domain/loans.js";

const KEY = "jsll.loans.v1";
const BACKUP_KEY = KEY + ".backup";

function loadLoans(storage) {
  const text = storage.getItem(KEY);
  if (text === null) {
    return { ok: false, reason: "missing" };
  }
  let saved;
  try {
    saved = JSON.parse(text);
  } catch (error) {
    storage.setItem(BACKUP_KEY, text);
    return { ok: false, reason: "unparsable" };
  }
  if (saved === null || typeof saved !== "object" || saved.schemaVersion !== 1 || !Array.isArray(saved.records)) {
    storage.setItem(BACKUP_KEY, text);
    return { ok: false, reason: "wrong-version" };
  }
  for (const loan of saved.records) {
    if (!validateLoan(loan).ok) {
      storage.setItem(BACKUP_KEY, text);
      return { ok: false, reason: "invalid-record" };
    }
  }
  return { ok: true, loans: saved.records };
}

function saveLoans(storage, loans) {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: loans }));
}

export { loadLoans, saveLoans };
