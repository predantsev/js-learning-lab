// A stand-in for the browser's `document` (read-only): Node.js has no DOM. It holds what the server
// sent — the markup inside #root and the JSON text inside #initial-data — and supports only
// getElementById, which returns { id, textContent, innerHTML } or null, plus `body`.
export function fakePage({ markup, json }) {
  const elements = {
    root: { id: 'root', textContent: markup.replace(/<[^>]*>/g, ''), innerHTML: markup },
    'initial-data': { id: 'initial-data', textContent: json, innerHTML: json },
  };
  return {
    body: { id: 'body', textContent: '', innerHTML: '' },
    getElementById: (id) => elements[id] ?? null,
  };
}
