export const STORAGE_KEY = "jsll.reading.v1";

// Saves the books as JSON text { "schemaVersion": 1, "books": [ … ] } under STORAGE_KEY.
export function saveBooks(storage, books) {}

// Reads the books back. Gives [] when nothing is saved, when the text is not valid JSON,
// when schemaVersion is not 1 or when books is not an array. Leaves out every record that is
// not an object with a string id, a title that is not empty and a known status. Never throws.
export function loadBooks(storage) {}
