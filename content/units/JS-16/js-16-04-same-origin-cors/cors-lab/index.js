// A simplified model of the browser's CORS rules next to real requests to the lab's CORS fixtures.
// The model covers the preflight trigger, Allow-Origin, Allow-Methods, Allow-Headers and credentials.
const SIMPLE_METHODS = ["GET", "HEAD", "POST"];
const SIMPLE_TYPES = ["text/plain", "multipart/form-data", "application/x-www-form-urlencoded"];

function corsDecision(request, response) {
  const nonSimpleHeaders = Object.entries(request.headers ?? {})
    .filter(([name, value]) => {
      const lower = name.toLowerCase();
      if (["accept", "accept-language", "content-language"].includes(lower)) return false;
      if (lower === "content-type") return !SIMPLE_TYPES.includes(value.split(";")[0].trim().toLowerCase());
      return true;
    })
    .map(([name]) => name.toLowerCase());
  const preflight = !SIMPLE_METHODS.includes(request.method) || nonSimpleHeaders.length > 0;

  const allowOrigin = response["access-control-allow-origin"];
  const originAllowed = request.credentials === "include"
    ? allowOrigin === request.origin && response["access-control-allow-credentials"] === "true"
    : allowOrigin === "*" || allowOrigin === request.origin;

  let preflightPassed = true;
  if (preflight) {
    const methods = (response["access-control-allow-methods"] ?? "").toUpperCase().split(",").map((m) => m.trim());
    const headers = (response["access-control-allow-headers"] ?? "").toLowerCase().split(",").map((h) => h.trim());
    preflightPassed = (SIMPLE_METHODS.includes(request.method) || methods.includes(request.method))
      && nonSimpleHeaders.every((name) => headers.includes(name));
  }
  return { preflight, readable: originAllowed && preflightPassed };
}

// Response headers recorded from the lab's CORS fixtures (server/lab: /lab/cors/...).
const RECORDED = {
  open: { "access-control-allow-origin": "*" },
  closed: {},
  preflight: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST", "access-control-allow-headers": "content-type" },
  credentials: { "access-control-allow-origin": "null", "access-control-allow-credentials": "true" },
};

// The sandbox page has an opaque origin, which the browser sends as "null".
const cases = [
  { fixture: "open", method: "GET" },
  { fixture: "closed", method: "GET" },
  { fixture: "preflight", method: "GET", headers: { "X-Request-Id": "r-17" } },
  { fixture: "preflight", method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
  { fixture: "open", method: "GET", credentials: "include" },
  { fixture: "credentials", method: "GET", credentials: "include" },
];

for (const c of cases) {
  const model = corsDecision({ origin: "null", ...c }, RECORDED[c.fixture]);
  let real;
  try {
    const response = await fetch(`/lab/cors/${c.fixture}`, { method: c.method, headers: c.headers, body: c.body, credentials: c.credentials });
    real = `%%readable%% (${response.status})`;
  } catch (error) {
    real = `%%blocked%% (${error.name}: ${error.message})`;
  }
  const extra = [c.headers ? JSON.stringify(c.headers) : "", c.credentials ? "credentials: include" : ""].join(" ").trim();
  console.log(`${c.method} /lab/cors/${c.fixture} ${extra}`);
  console.log(`  %%model%% preflight=${model.preflight}, ${model.readable ? "%%readable%%" : "%%blocked%%"} | %%real%% ${real}`);
}
