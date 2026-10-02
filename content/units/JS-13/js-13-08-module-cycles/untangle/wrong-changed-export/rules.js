export function DEFAULT_PRIORITY() {
  return "normal";
}

export function checkPriority(priority) {
  if (!["low", "normal", "high"].includes(priority)) {
    throw new RangeError("unknown priority: " + priority);
  }
}
