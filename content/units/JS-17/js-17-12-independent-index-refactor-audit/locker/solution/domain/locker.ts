import type { Locker, Parcel } from "../types.ts";

// A parcel locker: parcels arrive, customers look them up and pick them up by code,
// and parcels nobody collected go back to the sender, oldest first.
// A Map is the index by code; an array with a head index is the queue in arrival order.
// Picked-up parcels stay in the queue and are skipped later, so nothing is moved.
export function createLocker(): Locker {
  const byCode = new Map<string, Parcel>();
  const queue: Parcel[] = [];
  let head = 0;
  const skipCollected = () => {
    while (head < queue.length && byCode.get(queue[head].code) !== queue[head]) head = head + 1;
  };
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
      if (parcel !== null) byCode.delete(code);
      return parcel;
    },
    nextToReturn() {
      skipCollected();
      if (head === queue.length) return null;
      const parcel = queue[head];
      head = head + 1;
      byCode.delete(parcel.code);
      return parcel;
    },
    waitingCount() {
      return byCode.size;
    },
    oldest(limit) {
      const list: Parcel[] = [];
      for (let i = head; i < queue.length && list.length < limit; i++) {
        if (byCode.get(queue[i].code) === queue[i]) list.push(queue[i]);
      }
      return list;
    },
  };
}
