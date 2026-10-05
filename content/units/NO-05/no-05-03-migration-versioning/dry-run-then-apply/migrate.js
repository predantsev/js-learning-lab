// Wishlist store, version 1 → 2: `price` in whole currency units becomes `priceMinor`, an integer
// in minor units (cents, kopiykas). A version 2 store is returned as it is, so a rerun changes nothing.
export function migrate1to2(store) {
  if (store.schemaVersion === 2) return store;
  if (store.schemaVersion !== 1) throw new Error(`cannot migrate schemaVersion ${store.schemaVersion}`);
  const records = store.records.map(({ price, ...rest }) => {
    if (price !== null && !(Number.isFinite(price) && price >= 0)) {
      throw new Error(`${rest.id}: price ${JSON.stringify(price)} cannot become priceMinor`);
    }
    return { ...rest, priceMinor: price === null ? null : Math.round(price * 100) };
  });
  return { schemaVersion: 2, records }; // a new object: the input store is not touched
}

// What must stay true across the migration, measured on the old and the new store.
export function facts(store) {
  const minor = store.records.map((wish) => (store.schemaVersion === 1 ? (wish.price === null ? null : wish.price * 100) : wish.priceMinor));
  return {
    count: store.records.length,
    ids: store.records.map((wish) => wish.id).join(','),
    totalMinor: minor.reduce((sum, value) => sum + (value ?? 0), 0),
    withoutPrice: minor.filter((value) => value === null).length,
  };
}
