// A promise that is fulfilled after `ms` milliseconds.
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// requestJson(url, signal): see the task for what it must do.
async function requestJson(url, signal) {
  // Retries every failure, a 404 included, and never checks the Content-Type.
  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await fetch(url, { method: "GET", headers: { Accept: "application/json" }, signal: signal });
    if (response.ok) {
      return response.json();
    }
    await wait(100 * attempt);
  }
  const error = new Error("HTTP " + response.status);
  error.status = response.status;
  throw error;
}
