// Fetches `url` and returns (a promise of) the parsed JSON body.
// - When the response is not ok: rejects with an Error whose `status` property is the status code.
// - When the Content-Type is not JSON: rejects with an Error.
async function getJson(url) {
  const response = await fetch(url);
  const type = response.headers.get("content-type") || "";
  if (response.ok && type.startsWith("application/json")) {
    const data = await response.json();
    return data;
  }
  if (!response.ok) {
    const error = new Error("HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  throw new Error("Not JSON: " + type);
}

// To try it, add for example:
// console.log(await getJson("./data/expenses.json"));
