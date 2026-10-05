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
  let problem = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response = null;
    try {
      response = await fetch(url);
    } catch (error) {
      problem = error; // a network error: worth another attempt
    }
    if (response !== null) {
      if (response.ok) {
        return response;
      }
      if (response.status < 500) {
        const error = new Error("HTTP " + response.status + " for " + url);
        error.status = response.status;
        throw error; // 4xx: asking again will not help
      }
      problem = new Error("HTTP " + response.status + " for " + url);
    }
    if (attempt < attempts) {
      await wait(baseDelayMs * attempt);
    }
  }
  throw new Error("Gave up after " + attempts + " attempts: " + url, { cause: problem });
}

// To try it: /lab/flaky answers 503 twice and then 200 (a new key starts the count again).
// const response = await fetchWithRetry("/lab/flaky?fail=2&key=" + Date.now());
// console.log(await response.json());
