// budget.js: a handler that takes exactly one frame is also moved.
export function frameBudgetMs(hz) {
  return 1000 / hz;
}

export function handlersToMove(handlers, hz) {
  return handlers
    .filter((handler) => handler.when === 'during-swipe' && handler.ms >= frameBudgetMs(hz))
    .map((handler) => handler.name);
}
