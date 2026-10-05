import type { Locker, Parcel } from "../types.ts";

// Another valid approach: one Map for both. A Map keeps insertion order, and one iterator over its
// values is kept between calls, so every return continues where the previous one stopped.
// (Starting a new iteration for every return is slow in Chrome: the iterator has to step over
// every deleted entry from the start again.)
export function createLocker(): Locker {
  const byCode = new Map<string, Parcel>();
  let order = byCode.values();
  return {
    arrive(parcel) {
      if (byCode.has(parcel.code)) {
        throw new Error(`%%duplicateCode%% ${parcel.code}`);
      }
      byCode.set(parcel.code, parcel);
    },
    findByCode(code) {
      return byCode.get(code) ?? null;
    },
    pickUp(code) {
      const parcel = byCode.get(code) ?? null;
      byCode.delete(code);
      return parcel;
    },
    nextToReturn() {
      let next = order.next();
      if (next.done) {
        // A finished iterator stays finished: start a new one for parcels that arrived since.
        order = byCode.values();
        next = order.next();
      }
      if (next.done) return null;
      byCode.delete(next.value.code);
      return next.value;
    },
    waitingCount() {
      return byCode.size;
    },
    oldest(limit) {
      const list: Parcel[] = [];
      for (const parcel of byCode.values()) {
        if (list.length === limit) break;
        list.push(parcel);
      }
      return list;
    },
  };
}
