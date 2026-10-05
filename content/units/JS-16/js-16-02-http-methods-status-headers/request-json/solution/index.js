// Sends a request that asks for JSON and returns a result object instead of throwing:
//   { ok: true, value }                     the parsed JSON body
//   { ok: false, error: { reason, status } } reason: "network" | "status" | "type" | "parse"
async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { ...options, headers: { ...options.headers, Accept: "application/json" } });
  } catch (error) {
    return { ok: false, error: { reason: "network", status: null } };
  }
  if (!response.ok) {
    return { ok: false, error: { reason: "status", status: response.status } };
  }
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    return { ok: false, error: { reason: "type", status: response.status } };
  }
  try {
    return { ok: true, value: await response.json() };
  } catch (error) {
    return { ok: false, error: { reason: "parse", status: response.status } };
  }
}

console.log(await requestJson("./data/wishes.json"));
console.log(await requestJson("./data/missing.json"));
