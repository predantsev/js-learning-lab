// budget.js: a loop instead of filter/map.
export function frameBudgetMs(hz) {
  const msPerSecond = 1000;
  return msPerSecond / hz;
}

export function handlersToMove(handlers, hz) {
  const names = [];
  for (const { name, when, ms } of handlers) {
    if (when !== 'during-swipe') continue;
    if (ms <= frameBudgetMs(hz)) continue;
    names.push(name);
  }
  return names;
}
