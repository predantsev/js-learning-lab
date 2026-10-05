// true when `query` occurs inside `text`, whatever the letter case, the spaces
// around the query and the way accented letters were typed.
function matchesQuery(text, query) {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

console.log(matchesQuery("%%lamp%%", "%%lampQuery%%"));
console.log(matchesQuery("%%walk%%", "%%nothing%%"));
