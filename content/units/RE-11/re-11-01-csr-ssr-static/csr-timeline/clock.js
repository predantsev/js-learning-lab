// Milliseconds since this page started loading, rounded to tens so the log stays readable.
export function since() {
  return Math.round(performance.now() / 10) * 10;
}
