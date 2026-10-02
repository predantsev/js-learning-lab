const MAX_TEXT = 200;

// Puts "\" before every character that has a special meaning in a pattern.
function escapeForRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Returns the start positions of every match of `query` in `text`.
// No pattern at all: indexOf finds plain text, so nothing needs escaping.
function findAll(text, query) {
  const positions = [];
  if (query.length === 0) {
    return positions;
  }
  const haystack = text.slice(0, MAX_TEXT).toLowerCase();
  const needle = query.toLowerCase();
  let from = 0;
  while (from <= haystack.length) {
    const found = haystack.indexOf(needle, from);
    if (found === -1) {
      break;
    }
    positions.push(found);
    from = found + needle.length;
  }
  return positions;
}

console.log(findAll("%%books%%", "%%query%%"));
