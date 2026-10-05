// The configuration of the web client, read once when the bundle is built (scripts/build.mjs and
// scripts/release.mjs put the values of .env into the bundle as CLIENT_ENV). DATA_SOURCE picks the source
// of the habits: "http" — the records server at API_BASE_URL, "fixtures" (the default) — the fixture API.
// No silent fallback: "http" without an address, or an address that is not an http origin, is a
// configuration error. API_BASE_URL is public (every visitor's browser calls it), never a secret: a value
// that must stay secret never goes into .env of the web client.
export function loadClientConfig(env) {
  const problems = [];
  const dataSource = env.DATA_SOURCE || "fixtures";
  if (dataSource !== "fixtures" && dataSource !== "http") {
    problems.push(`DATA_SOURCE must be "fixtures" or "http", got "${dataSource}"`);
  }
  const apiBaseUrl = env.API_BASE_URL || "";
  if (dataSource === "http" && apiBaseUrl === "") {
    problems.push('API_BASE_URL is required when DATA_SOURCE is "http"');
  } else if (apiBaseUrl !== "" && (!URL.canParse(apiBaseUrl) || new URL(apiBaseUrl).origin !== apiBaseUrl || !apiBaseUrl.startsWith("http"))) {
    problems.push(`API_BASE_URL must be an origin such as http://127.0.0.1:4311 (no path, no trailing /), got "${apiBaseUrl}"`);
  }
  if (problems.length > 0) {
    throw new Error("Invalid configuration:\n" + problems.join("\n"));
  }
  return { dataSource: dataSource, apiBaseUrl: apiBaseUrl };
}
