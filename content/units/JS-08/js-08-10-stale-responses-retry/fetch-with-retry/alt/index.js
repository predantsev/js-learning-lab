// A promise that is fulfilled after `ms` milliseconds.
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// Fetches `url` and returns the response once it is ok.
// - A network error (fetch rejects) or a 5xx status is worth another attempt.
// - Any other status that is not ok (4xx) rejects at once with an Error whose
//   `status` property is that status: asking again will not change the answer.
// - At most `attempts` attempts; before each next attempt wait longer than before,
//   starting from `baseDelayMs`. After the last failed attempt reject with an Error.
async function fetchWithRetry(url, { attempts = 3, baseDelayMs = 200 } = {}) {
  // Another way: the function calls itself with one attempt fewer and a doubled pause.
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    if (attempts <= 1) {
      throw new Error("Gave up: " + url, { cause: error });
    }
    await wait(baseDelayMs);
    return fetchWithRetry(url, { attempts: attempts - 1, baseDelayMs: baseDelayMs * 2 });
  }
  if (response.ok) {
    return response;
  }
  if (response.status < 500) {
    const error = new Error("HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  if (attempts <= 1) {
    throw new Error("Gave up after a " + response.status + ": " + url);
  }
  await wait(baseDelayMs);
  return fetchWithRetry(url, { attempts: attempts - 1, baseDelayMs: baseDelayMs * 2 });
}

// To try it: /lab/flaky answers 503 twice and then 200 (a new key starts the count again).
// const response = await fetchWithRetry("/lab/flaky?fail=2&key=" + Date.now());
// console.log(await response.json());
