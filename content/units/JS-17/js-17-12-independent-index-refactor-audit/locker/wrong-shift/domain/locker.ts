import type { Locker, Parcel } from "../types.ts";

// An index for codes, but the queue is a plain array: every return shifts all other parcels.
export function createLocker(): Locker {
  const byCode = new Map<string, Parcel>();
  let queue: Parcel[] = [];
  return {
    arrive(parcel) {
      if (byCode.has(parcel.code)) throw new Error(`%%duplicateCode%% ${parcel.code}`);
      byCode.set(parcel.code, parcel);
      queue.push(parcel);
    },
    findByCode(code) {
      return byCode.get(code) ?? null;
    },
    pickUp(code) {
      const parcel = byCode.get(code) ?? null;
      if (parcel !== null) {
        byCode.delete(code);
        queue.splice(queue.indexOf(parcel), 1);
      }
      return parcel;
    },
    nextToReturn() {
      const parcel = queue.shift() ?? null;
      if (parcel !== null) byCode.delete(parcel.code);
      return parcel;
    },
    waitingCount() {
      return byCode.size;
    },
    oldest(limit) {
      return queue.slice(0, limit);
    },
  };
}
