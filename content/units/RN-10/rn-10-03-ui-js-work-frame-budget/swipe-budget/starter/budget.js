// budget.js: how much time one frame gives, and which handlers would break a JS-driven swipe.

// Milliseconds in one frame of a screen that refreshes `hz` times per second.
export function frameBudgetMs(hz) {
  // TODO
  return 0;
}

// handlers: [{ name, when, ms }] — `when` is 'during-swipe' (runs on every movement update of the swipe)
// or 'after-swipe' (runs once, after the row was dismissed); `ms` is how long one run blocks the JS thread.
// Returns the names of the handlers that run during the swipe and take longer than one frame, in input order.
export function handlersToMove(handlers, hz) {
  // TODO
  return [];
}
