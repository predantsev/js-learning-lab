const MAX_TEXT = 200;

// Puts "\" before every character that has a special meaning in a pattern.
function escapeForRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Returns the start positions of every match of `query` in `text`.
function findAll(text, query) {
  if (query === "") {
    return [];
  }
  const limited = text.slice(0, MAX_TEXT);
  const pattern = new RegExp(escapeForRegex(query), "gi");
  const positions = [];
  for (const match of limited.matchAll(pattern)) {
    positions.push(match.index);
  }
  return positions;
}

console.log(findAll("%%books%%", "%%query%%"));
