// Loads the expenses from the server. A test may pass its own fetchFn instead of fetch.
export async function loadExpenses(fetchFn = fetch) {
  const response = await fetchFn("/lab/expenses/items?lang=%%lang%%");
  if (!response.ok) {
    return { state: "error", status: response.status };
  }
  const data = await response.json();
  return { state: "ready", expenses: data.items };
}
