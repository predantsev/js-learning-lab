const MAX_TEXT = 200;

// Puts "\" before every character that has a special meaning in a pattern.
function escapeForRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Returns the start positions of every match of `query` in `text`.
// Refuses a long text altogether instead of searching its first MAX_TEXT characters.
function findAll(text, query) {
  if (query === "" || text.length > MAX_TEXT) {
    return [];
  }
  const pattern = new RegExp(escapeForRegex(query), "gi");
  const positions = [];
  for (const match of text.matchAll(pattern)) {
    positions.push(match.index);
  }
  return positions;
}

console.log(findAll("%%books%%", "%%query%%"));
