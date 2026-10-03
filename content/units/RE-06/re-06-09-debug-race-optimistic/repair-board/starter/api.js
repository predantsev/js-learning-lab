// Talks to the server. Both functions are correct; the bugs are elsewhere.
export async function searchWishes(query, { signal } = {}) {
  const response = await fetch(`/api/wishes?q=${encodeURIComponent(query)}`, { signal });
  return response.json();
}

// A mutation: one PATCH, and a result instead of a rejection.
export async function updateWish(id, patch) {
  try {
    const response = await fetch(`/api/wishes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) return { ok: false, status: response.status };
    return { ok: true, value: await response.json() };
  } catch {
    return { ok: false, status: 0 };
  }
}
