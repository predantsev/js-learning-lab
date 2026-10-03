// The real search: the course's lab server on this computer. Like many real servers, it answers
// shorter queries more slowly.
export async function searchLab(query, { signal } = {}) {
  const response = await fetch(`/lab/search?ns=habits&lang=%%lang%%&q=${encodeURIComponent(query)}`, { signal });
  const data = await response.json();
  return data.results.map(({ id, name }) => ({ id, name }));
}
