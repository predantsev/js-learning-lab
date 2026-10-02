// A promise that is fulfilled after `ms` milliseconds.
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// requestJson(url, signal): see the task for what it must do.
async function requestJson(url, signal) {
  const options = { method: "GET", headers: { Accept: "application/json" }, signal: signal };
  let response = await fetch(url, options);
  let pause = 100;
  let retries = 0;
  while (response.status === 503 && retries < 2) {
    await wait(pause);
    pause *= 2;
    retries += 1;
    response = await fetch(url, options);
  }
  if (!response.ok) {
    const error = new Error("HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  if (!(response.headers.get("content-type") || "").startsWith("application/json")) {
    throw new Error("Not JSON");
  }
  return await response.json();
}
