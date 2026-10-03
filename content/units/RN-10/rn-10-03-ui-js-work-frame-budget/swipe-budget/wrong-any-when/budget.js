// budget.js: every slow handler is moved, even one that never runs during the swipe.
export function frameBudgetMs(hz) {
  return 1000 / hz;
}

export function handlersToMove(handlers, hz) {
  return handlers.filter((handler) => handler.ms > frameBudgetMs(hz)).map((handler) => handler.name);
}
