// Fetches `url` and returns (a promise of) the parsed JSON body.
// - When the response is not ok: rejects with an Error whose `status` property is the status code.
// - When the Content-Type is not JSON: rejects with an Error.
async function getJson(url) {
  // Mistake: only 200 counts as success, although every 2xx status is ok.
  const response = await fetch(url);
  if (response.status !== 200) {
    const error = new Error("HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    throw new Error("Expected JSON from " + url);
  }
  return response.json();
}

// To try it, add for example:
// console.log(await getJson("./data/expenses.json"));
