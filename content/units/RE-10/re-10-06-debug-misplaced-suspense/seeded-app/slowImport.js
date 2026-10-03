// The course's import-delay control. In the sandbox every file is already on this computer,
// so a module would arrive at once; slowly() waits LOAD_DELAY_MS first, like a slow network.
export const LOAD_DELAY_MS = 600;

export function slowly(load) {
  return () => new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS)).then(load);
}
