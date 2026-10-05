const status = document.querySelector("#status");
let controller = null;

async function load() {
  controller = new AbortController();
  const startedAt = Date.now();
  status.textContent = "%%loading%%";
  // A hint for slow answers; it belongs to this request, so it is cleared when the request ends.
  const slowHint = setTimeout(() => {
    status.textContent = "%%stillLoading%%";
  }, 1000);

  try {
    const response = await fetch("/lab/delay/2000", { signal: controller.signal });
    const body = await response.json();
    status.textContent = "%%loaded%% " + body.waited + " %%ms%%";
  } catch (error) {
    console.log(error.name, "—", error.message, Date.now() - startedAt, "%%ms%%");
    if (error.name === "AbortError") {
      status.textContent = "%%cancelled%%";
    } else {
      status.textContent = "%%failed%% " + error.name;
    }
  } finally {
    clearTimeout(slowHint);
  }
}

document.querySelector("#load").addEventListener("click", load);
document.querySelector("#cancel").addEventListener("click", () => {
  controller?.abort();
});
