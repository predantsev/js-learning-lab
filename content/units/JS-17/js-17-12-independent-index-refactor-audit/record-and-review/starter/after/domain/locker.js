// A parcel locker, as proposed in the pull request.
export function createLocker() {
  const byCode = new Map();
  const queue = [];
  return {
    arrive(parcel) {
      byCode.set(parcel.code, parcel);
      queue.push(parcel);
    },
    findByCode(code) {
      return byCode.get(code);
    },
    pickUp(code) {
      const parcel = byCode.get(code) ?? null;
      byCode.delete(code);
      return parcel;
    },
    nextToReturn() {
      return queue.shift() ?? null;
    },
    waitingCount() {
      return queue.length;
    },
    oldest(limit) {
      return queue.slice(0, limit);
    },
  };
}
