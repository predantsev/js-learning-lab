// Read-only helper: fetches JSON with the given abort signal.
// Rejects with an Error that has a `status` property when the response is not ok,
// with a TypeError when there is no network and with an AbortError when aborted.
export async function getJson(url, signal) {
  const response = await fetch(url, { signal: signal });
  if (!response.ok) {
    const error = new Error("HTTP " + response.status + " for " + url);
    error.status = response.status;
    throw error;
  }
  return response.json();
}
