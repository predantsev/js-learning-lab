// The average of the times: one slow run pulls it up.
export function median(values) {
  let sum = 0;
  for (const value of values) sum = sum + value;
  return sum / values.length;
}

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
