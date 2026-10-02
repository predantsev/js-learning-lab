// Fetches `url` and returns (a promise of) the parsed JSON body.
// - When the response is not ok: rejects with an Error whose `status` property is the status code.
// - When the Content-Type is not JSON: rejects with an Error.
async function getJson(url) {
  // Mistake: the Content-Type is never checked.
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error("HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// To try it, add for example:
// console.log(await getJson("./data/expenses.json"));
