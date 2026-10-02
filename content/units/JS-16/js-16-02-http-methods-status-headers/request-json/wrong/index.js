// Checks the status but trusts any 200 to be JSON.
async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { ...options, headers: { ...options.headers, Accept: "application/json" } });
  } catch (error) {
    return { ok: false, error: { reason: "network", status: null } };
  }
  if (!response.ok) return { ok: false, error: { reason: "status", status: response.status } };
  try {
    return { ok: true, value: await response.json() };
  } catch (error) {
    return { ok: false, error: { reason: "parse", status: response.status } };
  }
}
