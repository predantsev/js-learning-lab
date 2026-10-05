// Spreads the options after its own headers, so headers given by the caller replace Accept.
async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" }, ...options });
  } catch (error) {
    return { ok: false, error: { reason: "network", status: null } };
  }
  if (!response.ok) return { ok: false, error: { reason: "status", status: response.status } };
  if (!(response.headers.get("content-type") ?? "").includes("application/json")) return { ok: false, error: { reason: "type", status: response.status } };
  try {
    return { ok: true, value: await response.json() };
  } catch (error) {
    return { ok: false, error: { reason: "parse", status: response.status } };
  }
}
