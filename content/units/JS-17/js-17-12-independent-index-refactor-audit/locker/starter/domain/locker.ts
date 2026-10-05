import type { Locker, Parcel } from "../types.ts";

// A parcel locker: parcels arrive, customers look them up and pick them up by code,
// and parcels nobody collected go back to the sender, oldest first.
export function createLocker(): Locker {
  let parcels: Parcel[] = []; // in arrival order
  return {
    arrive(parcel) {
      if (parcels.some((waiting) => waiting.code === parcel.code)) {
        throw new Error(`%%duplicateCode%% ${parcel.code}`);
      }
      parcels.push(parcel);
    },
    findByCode(code) {
      return parcels.find((waiting) => waiting.code === code) ?? null;
    },
    pickUp(code) {
      const parcel = parcels.find((waiting) => waiting.code === code) ?? null;
      if (parcel !== null) {
        parcels = parcels.filter((waiting) => waiting !== parcel);
      }
      return parcel;
    },
    nextToReturn() {
      return parcels.shift() ?? null;
    },
    waitingCount() {
      return parcels.length;
    },
    oldest(limit) {
      return parcels.slice(0, limit);
    },
  };
}
