export function median(values) {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

// One run per size: a single timing proves nothing.
export function measure(fn, sizes, repeats) {
  return sizes.map((size) => {
    const start = performance.now();
    const operations = fn(size);
    return { size, operations, medianMs: performance.now() - start };
  });
}
