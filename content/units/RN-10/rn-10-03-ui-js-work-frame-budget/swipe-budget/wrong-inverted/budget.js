// budget.js: the division is upside down (frames per millisecond instead of milliseconds per frame).
export function frameBudgetMs(hz) {
  return hz / 1000;
}

export function handlersToMove(handlers, hz) {
  return handlers
    .filter((handler) => handler.when === 'during-swipe' && handler.ms > frameBudgetMs(hz))
    .map((handler) => handler.name);
}
