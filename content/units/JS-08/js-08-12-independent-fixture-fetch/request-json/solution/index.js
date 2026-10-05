// A promise that is fulfilled after `ms` milliseconds.
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// requestJson(url, signal): see the task for what it must do.
async function requestJson(url, signal) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: signal,
    });
    if (response.status === 503 && attempt < 3) {
      await wait(100 * attempt);
      continue;
    }
    if (!response.ok) {
      const error = new Error("HTTP " + response.status + " for " + url);
      error.status = response.status;
      throw error;
    }
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("application/json")) {
      throw new Error("Expected JSON from " + url + ", got " + type);
    }
    return response.json();
  }
}
