// The middle value of a list of numbers. For an even count it is the mean of the two middle
// values. It must not change the list it receives.
export function median(values) {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

// Calls fn(size) `repeats` times for every size and times each call with performance.now().
// fn returns the number of operations it made. Returns one row per size, in the order of sizes:
// { size, operations, medianMs }.
export function measure(fn, sizes, repeats) {
  return sizes.map((size) => {
    const times = [];
    let operations = 0;
    for (let run = 0; run < repeats; run++) {
      const start = performance.now();
      operations = fn(size);
      times.push(performance.now() - start);
    }
    return { size, operations, medianMs: median(times) };
  });
}
