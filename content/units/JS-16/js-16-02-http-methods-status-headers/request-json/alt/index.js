// Sends a request that asks for JSON and returns a result object instead of throwing.
async function requestJson(url, options = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  const failed = (reason, status = null) => ({ ok: false, error: { reason, status } });
  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) return failed("status", response.status);
    if (!(response.headers.get("content-type") || "").startsWith("application/json")) return failed("type", response.status);
    const text = await response.text();
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch (error) {
      return failed("parse", response.status);
    }
  } catch (error) {
    return failed("network");
  }
}
