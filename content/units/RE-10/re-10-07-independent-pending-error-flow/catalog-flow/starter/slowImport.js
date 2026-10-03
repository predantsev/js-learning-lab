// The course's import-delay control: waits LOAD_DELAY_MS before loading, like a slow network.
// While loadControl.failuresLeft is above 0, a load fails instead, like a dropped connection.
export const LOAD_DELAY_MS = 400;
export const loadControl = { failuresLeft: 0 };

export function slowly(load) {
  return () =>
    new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS)).then(() => {
      if (loadControl.failuresLeft > 0) {
        loadControl.failuresLeft -= 1;
        throw new Error("Failed to load the module (simulated network failure)");
      }
      return load();
    });
}
