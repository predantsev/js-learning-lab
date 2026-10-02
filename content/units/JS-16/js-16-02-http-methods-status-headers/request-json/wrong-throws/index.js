// Throws on every failure, like an ordinary fetch helper, instead of returning a result.
async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...options.headers, Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!(response.headers.get("content-type") ?? "").includes("application/json")) throw new Error("not JSON");
  return { ok: true, value: await response.json() };
}
