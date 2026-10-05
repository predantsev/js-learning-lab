// A promise that is fulfilled after `ms` milliseconds.
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// requestJson(url, signal): see the task for what it must do.
async function requestJson(url, signal) {
  // your code here
}
