// budget.js: one fixed budget for every screen, as if all phones were 60 Hz.
export function frameBudgetMs() {
  return 16.67;
}

export function handlersToMove(handlers, hz) {
  return handlers
    .filter((handler) => handler.when === 'during-swipe' && handler.ms > frameBudgetMs(hz))
    .map((handler) => handler.name);
}
