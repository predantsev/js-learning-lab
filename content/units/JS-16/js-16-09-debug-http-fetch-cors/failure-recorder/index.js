// Records what the code itself sees for each failing request: a Response, or a rejection.
async function record(label, url) {
  try {
    const response = await fetch(url);
    const type = response.headers.get("content-type");
    console.log(`${label}: %%fulfilled%% ${response.status}, ok ${response.ok}, Content-Type ${type}`);
  } catch (error) {
    console.log(`${label}: %%rejected%% ${error.name}: ${error.message}`);
  }
}

await record("500", "/lab/status/500");
await record("CORS", "/lab/cors/closed");

// For the offline case: run first, then switch DevTools to Offline and press the button.
document.querySelector("#again").addEventListener("click", () => record("%%againLabel%%", "/lab/ping"));
