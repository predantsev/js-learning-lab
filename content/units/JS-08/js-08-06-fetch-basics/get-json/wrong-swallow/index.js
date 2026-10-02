// Fetches `url` and returns (a promise of) the parsed JSON body.
// - When the response is not ok: rejects with an Error whose `status` property is the status code.
// - When the Content-Type is not JSON: rejects with an Error.
async function getJson(url) {
  // Mistake: every failure is swallowed and turned into null.
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    return null;
  }
}

// To try it, add for example:
// console.log(await getJson("./data/expenses.json"));
