// The threat model built from a compact list, including the CORS row in its proper place:
// it protects the response from a foreign PAGE in a browser, never from a script.
const row = (asset, threat, entryPoint, control, proof) => ({ asset, threat, entryPoint, control, proof });

export const threats = [
  row("%%assetNotes%%", "%%threatForeignPageReads%%", 'browser-page', 'cors-allowlist', 'foreign-page-gets-no-cors-header'),
  row("%%assetNotes%%", "%%threatCurl%%", 'non-browser-client', 'session-check', 'no-session-gets-401'),
  row("%%assetNotes%%", "%%threatForeignId%%", 'note-url', 'ownership-scope', 'foreign-note-gets-404'),
  row("%%assetAccounts%%", "%%threatGuessing%%", 'login-form', 'rate-limit', 'brute-force-gets-429'),
  row("%%assetKey%%", "%%threatWeakKey%%", 'config', 'secret-from-env', 'weak-secret-refuses-start'),
];
