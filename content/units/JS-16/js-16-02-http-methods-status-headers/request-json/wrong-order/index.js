// Checks the Content-Type before the status, so an error page that is not JSON is reported as "type".
async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { ...options, headers: { ...options.headers, Accept: "application/json" } });
  } catch (error) {
    return { ok: false, error: { reason: "network", status: null } };
  }
  if (!(response.headers.get("content-type") ?? "").includes("application/json")) return { ok: false, error: { reason: "type", status: response.status } };
  if (!response.ok) return { ok: false, error: { reason: "status", status: response.status } };
  try {
    return { ok: true, value: await response.json() };
  } catch (error) {
    return { ok: false, error: { reason: "parse", status: response.status } };
  }
}
