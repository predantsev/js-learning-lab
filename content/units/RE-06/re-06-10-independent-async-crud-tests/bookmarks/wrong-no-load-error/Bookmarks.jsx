import { useEffect, useState } from "react";

const JSON_HEADERS = { "content-type": "application/json" };

// The query: the only place that reads the list. `invalidate` makes it read again.
function useBookmarks() {
  const [round, setRound] = useState(0);
  const [list, setList] = useState({ status: "loading", data: null });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/bookmarks", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => setList({ status: "ready", data }))
      .catch((error) => {
        if (error.name !== "AbortError") setList((current) => ({ ...current, status: "failed" }));
      });
    return () => controller.abort();
  }, [round]);

  return { ...list, invalidate: () => setRound((current) => current + 1) };
}

// A mutation: one request, true when the server accepted it.
async function write(method, path, body) {
  try {
    const response = await fetch(path, { method, headers: JSON_HEADERS, body: body && JSON.stringify(body) });
    return response.ok;
  } catch {
    return false;
  }
}

export default function Bookmarks() {
  const bookmarks = useBookmarks();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function change(method, path, body) {
    setError("");
    const ok = await write(method, path, body);
    if (ok) bookmarks.invalidate();
    else setError("%%saveFailed%%");
    return ok;
  }

  async function handleAdd(event) {
    event.preventDefault();
    setSaving(true);
    if (await change("POST", "/api/bookmarks", { title, url })) {
      setTitle("");
      setUrl("");
    }
    setSaving(false);
  }

  const alert = error;

  return (
    <section>
      <p role="status">{bookmarks.data === null && bookmarks.status === "loading" ? "%%loading%%" : ""}</p>
      <p role="alert">{alert}</p>
      <form onSubmit={handleAdd}>
        <label htmlFor="bookmark-title">%%titleField%%</label>
        <input id="bookmark-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <label htmlFor="bookmark-url">%%urlField%%</label>
        <input id="bookmark-url" value={url} onChange={(event) => setUrl(event.target.value)} />
        <button type="submit" disabled={saving}>
          %%add%%
        </button>
      </form>
      {bookmarks.data?.length === 0 && <p>%%empty%%</p>}
      <ul>
        {(bookmarks.data ?? []).map((bookmark) => (
          <li key={bookmark.id}>
            <a href={bookmark.url}>{bookmark.title}</a>{" "}
            <button
              aria-pressed={bookmark.favorite}
              onClick={() => change("PATCH", `/api/bookmarks/${bookmark.id}`, { favorite: !bookmark.favorite })}
            >
              %%favorite%%
            </button>{" "}
            <button onClick={() => change("DELETE", `/api/bookmarks/${bookmark.id}`)}>%%remove%%</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
