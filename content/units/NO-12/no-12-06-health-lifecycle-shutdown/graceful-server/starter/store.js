// A demo expense store (read-only): ready after a short start, slow updates, flush() to disk.
export function createDemoStore() {
  const expenses = [{ id: 'e-03', label: '%%coffee%%', amountMinor: 18000, category: 'fun' }];
  let ready = false;
  setTimeout(() => { ready = true; }, 100);
  return {
    isReady: () => ready,
    list: () => expenses,
    async update(id, changes) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return Object.assign(expenses.find((e) => e.id === id), changes);
    },
    async flush() {
      console.log('store: %%flushed%%');
    },
  };
}
