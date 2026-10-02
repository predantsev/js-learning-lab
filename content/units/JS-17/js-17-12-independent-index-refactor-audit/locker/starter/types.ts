// The interface of the parcel locker. Read-only: keep your implementation behind it.
export interface Parcel {
  code: string; // the pickup code, unique among waiting parcels
  recipient: string;
}

export interface Locker {
  arrive(parcel: Parcel): void; // a code that is already waiting throws an Error
  findByCode(code: string): Parcel | null;
  pickUp(code: string): Parcel | null; // removes and returns the parcel, or null
  nextToReturn(): Parcel | null; // removes and returns the oldest waiting parcel, or null
  waitingCount(): number;
  oldest(limit: number): Parcel[]; // up to `limit` waiting parcels, oldest first, as a new array
}
