// true when `query` occurs inside `text`, whatever the letter case, the spaces
// around the query and the way accented letters were typed.
function toSearchKey(value) {
  return value.normalize("NFC").trim().toLowerCase();
}

function matchesQuery(text, query) {
  return toSearchKey(text).includes(toSearchKey(query));
}

console.log(matchesQuery("%%lamp%%", "%%lampQuery%%"));
console.log(matchesQuery("%%walk%%", "%%nothing%%"));
