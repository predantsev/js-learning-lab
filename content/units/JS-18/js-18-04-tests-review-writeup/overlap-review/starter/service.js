// The booking service: it loads the bookings, asks the rules and saves. Read-only.
// The rules are a parameter, so a test can pass either a real rules module or a replacement.

export function createBookingService(store, rules) {
  return {
    book(request) {
      const bookings = store.load();
      if (!rules.canBook(bookings, request)) return { ok: false };
      store.save([...bookings, { ...request, id: `b-${bookings.length + 1}` }]);
      return { ok: true };
    },
  };
}

// A store that keeps bookings in memory: what load returns is always a fresh copy.
export function memoryStore(initial = []) {
  let saved = structuredClone(initial);
  return {
    load: () => structuredClone(saved),
    save: (bookings) => {
      saved = structuredClone(bookings);
    },
  };
}
