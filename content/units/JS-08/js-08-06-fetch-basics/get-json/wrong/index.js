// Fetches `url` and returns (a promise of) the parsed JSON body.
// - When the response is not ok: rejects with an Error whose `status` property is the status code.
// - When the Content-Type is not JSON: rejects with an Error.
async function getJson(url) {
  // Mistake: no ok check, so an error page is treated like data.
  const response = await fetch(url);
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    throw new Error("Expected JSON from " + url);
  }
  return response.json();
}

// To try it, add for example:
// console.log(await getJson("./data/expenses.json"));
