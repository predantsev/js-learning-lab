// A promise that is fulfilled after `ms` milliseconds.
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// requestJson(url, signal): see the task for what it must do.
async function requestJson(url, signal) {
  // Never retries a 503 and sends no Accept header.
  const response = await fetch(url, { signal: signal });
  if (!response.ok) {
    const error = new Error("HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    throw new Error("Not JSON");
  }
  return response.json();
}
