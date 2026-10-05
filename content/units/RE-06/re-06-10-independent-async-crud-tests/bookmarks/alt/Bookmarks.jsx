import { useEffect, useState } from "react";

const JSON_HEADERS = { "content-type": "application/json" };

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [version, setVersion] = useState(0); // the list query reads again whenever this grows
  const [form, setForm] = useState({ title: "", url: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const response = await fetch("/api/bookmarks");
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        if (!ignore) {
          setBookmarks(data);
          setLoadFailed(false);
        }
      } catch {
        if (!ignore) setLoadFailed(true);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [version]);

  async function send(method, path, body) {
    try {
      const response = await fetch(path, { method, headers: JSON_HEADERS, body: body ? JSON.stringify(body) : undefined });
      if (!response.ok) throw new Error(String(response.status));
      setMessage("");
      setVersion((current) => current + 1);
      return true;
    } catch {
      setMessage("%%saveFailed%%");
      return false;
    }
  }

  // Optimistic favorite: show it at once, put back only this bookmark if the server refuses.
  async function toggleFavorite(bookmark) {
    const setFavorite = (value) =>
      setBookmarks((current) => current.map((item) => (item.id === bookmark.id ? { ...item, favorite: value } : item)));
    setFavorite(!bookmark.favorite);
    if (!(await send("PATCH", `/api/bookmarks/${bookmark.id}`, { favorite: !bookmark.favorite }))) setFavorite(bookmark.favorite);
  }

  async function handleAdd(event) {
    event.preventDefault();
    setSaving(true);
    if (await send("POST", "/api/bookmarks", form)) setForm({ title: "", url: "" });
    setSaving(false);
  }

  return (
    <section>
      <p role="status">{bookmarks === null && !loadFailed ? "%%loading%%" : ""}</p>
      <p role="alert">{loadFailed ? "%%loadFailed%%" : message}</p>
      <form onSubmit={handleAdd}>
        <label>
          %%titleField%%
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label>
          %%urlField%%
          <input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
        </label>
        <button type="submit" disabled={saving}>
          %%add%%
        </button>
      </form>
      {bookmarks !== null && bookmarks.length === 0 ? (
        <p>%%empty%%</p>
      ) : (
        <ul>
          {(bookmarks ?? []).map((bookmark) => (
            <li key={bookmark.id}>
              <a href={bookmark.url}>{bookmark.title}</a>
              <button aria-pressed={bookmark.favorite} onClick={() => toggleFavorite(bookmark)}>
                %%favorite%%
              </button>
              <button onClick={() => send("DELETE", `/api/bookmarks/${bookmark.id}`)}>%%remove%%</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
