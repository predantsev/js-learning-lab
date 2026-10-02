const MAX_TEXT = 200;

// Puts "\" before every character that has a special meaning in a pattern.
function escapeForRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Returns the start positions of every match of `query` in `text`.
function findAll(text, query) {
  const pattern = new RegExp(query, "g");
  const positions = [];
  for (const match of text.matchAll(pattern)) {
    positions.push(match.index);
  }
  return positions;
}

console.log(findAll("%%books%%", "%%query%%"));
