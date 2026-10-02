// Measures two ways of finding which plants to water: a scan of the id list for every plant,
// and a Set built once. Read-only. Each size runs 5 times; the median time is printed.
function scanWater(plants, ids, today) {
  return plants.map((plant) => (ids.includes(plant.id) ? { ...plant, lastWatered: today } : plant));
}

function setWater(plants, ids, today) {
  const watered = new Set(ids);
  return plants.map((plant) => (watered.has(plant.id) ? { ...plant, lastWatered: today } : plant));
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function measure(fn, plants, ids) {
  const times = [];
  for (let run = 0; run < 5; run++) {
    const start = performance.now();
    fn(plants, ids, "2026-05-20");
    times.push(performance.now() - start);
  }
  return median(times).toFixed(2);
}

for (const size of [2000, 20000]) {
  const plants = Array.from({ length: size }, (_, i) => ({ id: `p-${i}`, lastWatered: "2026-05-01" }));
  const ids = Array.from({ length: 500 }, (_, i) => `p-${i * 3}`);
  console.log(`%%benchLine%% ${size}: scan ${measure(scanWater, plants, ids)} ms, Set ${measure(setWater, plants, ids)} ms`);
}
