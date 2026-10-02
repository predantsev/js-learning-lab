export const STORAGE_KEY = "jsll.reading.v1";
const STATUSES = ["to-read", "reading", "done"];

// Saves the books as JSON text { "schemaVersion": 1, "books": [ … ] } under STORAGE_KEY.
export function saveBooks(storage, books) {
  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, books }));
}

function isBook(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    value.title.trim() !== "" &&
    STATUSES.includes(value.status)
  );
}

// Reads the books back. Gives [] when nothing is saved, when the text is not valid JSON,
// when schemaVersion is not 1 or when books is not an array. Leaves out every record that is
// not an object with a string id, a title that is not empty after trimming and a known status.
// Never throws.
export function loadBooks(storage) {
  const text = storage.getItem(STORAGE_KEY);
  if (text === null) return [];
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return [];
  }
  if (data === null || typeof data !== "object" || data.schemaVersion !== 1 || !Array.isArray(data.books)) {
    return [];
  }
  return data.books.filter(isBook);
}
