// Another valid approach: a copy with spread and sort(comparator), and a for...of loop over sizes.
export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

export function measure(fn, sizes, repeats) {
  const rows = [];
  for (const size of sizes) {
    const times = [];
    let operations;
    for (let i = 0; i < repeats; i++) {
      const before = performance.now();
      operations = fn(size);
      const after = performance.now();
      times.push(after - before);
    }
    rows.push({ size, operations, medianMs: median(times) });
  }
  return rows;
}
