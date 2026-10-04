// FNV-1a over a list of amounts, repeated `rounds` times: pure CPU work. Used by the main thread
// and by checksum-worker.js alike.
export function checksum(amounts, rounds) {
  let hash = 2166136261;
  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < amounts.length; i++) hash = Math.imul(hash ^ amounts[i], 16777619) >>> 0;
  }
  return hash;
}
