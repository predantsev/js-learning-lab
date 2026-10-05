// Measures two ways of answering "is this plant's id in the list?" for every plant:
// a scan of the id list each time, and a Set built once. Read-only. Each size runs 5 times;
// the median time is printed.
function countByScan(plants, ids) {
  let found = 0;
  for (const plant of plants) if (ids.includes(plant.id)) found += 1;
  return found;
}

function countBySet(plants, ids) {
  const lookup = new Set(ids);
  let found = 0;
  for (const plant of plants) if (lookup.has(plant.id)) found += 1;
  return found;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function measure(fn, plants, ids) {
  const times = [];
  for (let run = 0; run < 5; run++) {
    const start = performance.now();
    fn(plants, ids);
    times.push(performance.now() - start);
  }
  return median(times).toFixed(2);
}

for (const size of [2000, 20000]) {
  const plants = Array.from({ length: size }, (_, i) => ({ id: `p-${i}` }));
  const ids = Array.from({ length: 500 }, (_, i) => `p-${i * 3}`);
  console.log(`%%benchLine%% ${size}: scan ${measure(countByScan, plants, ids)} ms, Set ${measure(countBySet, plants, ids)} ms`);
}
