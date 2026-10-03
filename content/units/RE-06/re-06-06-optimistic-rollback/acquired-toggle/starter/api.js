// The mutation from the previous lesson: one PATCH, and a result instead of a rejection.
export async function updateWish(id, patch) {
  try {
    const response = await fetch(`/api/wishes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    return { ok: true, value: await response.json() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
