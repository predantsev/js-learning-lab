// Read-only helper: an in-memory storage adapter. Screens read and write records only through it,
// so a native adapter could take its place without changing them. Like storage on a device, a read
// takes time: it answers with the records as they were when the read began.
export function createMemoryStorage(initialRecords, { delayMs = 80 } = {}) {
  let records = initialRecords;
  let reads = 0;
  let nextDelays = [];
  return {
    readAll() {
      reads += 1;
      const snapshot = records.map((record) => ({ ...record }));
      const delay = nextDelays.length > 0 ? nextDelays.shift() : delayMs;
      return new Promise((resolve) => setTimeout(() => resolve(snapshot), delay));
    },
    async writeAll(next) {
      records = next.map((record) => ({ ...record }));
    },
    // For checks: how many reads started, and the delays of the next reads (in ms).
    readCount: () => reads,
    setNextDelays(delays) {
      nextDelays = [...delays];
    },
  };
}
