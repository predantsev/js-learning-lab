// Sends a request that asks for JSON and returns a result object instead of throwing:
//   { ok: true, value }                     the parsed JSON body
//   { ok: false, error: { reason, status } } reason: "network" | "status" | "type" | "parse"
async function requestJson(url, options = {}) {
  // your code here
}

// To try it, add for example:
// console.log(await requestJson("./data/wishes.json"));
// console.log(await requestJson("./data/missing.json"));
