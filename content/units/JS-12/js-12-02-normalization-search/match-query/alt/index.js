// true when `query` occurs inside `text`, whatever the letter case, the spaces
// around the query and the way accented letters were typed.
function matchesQuery(text, query) {
  const field = text.toLowerCase().normalize("NFD");
  const wanted = query.trim().toLowerCase().normalize("NFD");
  return field.includes(wanted);
}

console.log(matchesQuery("%%lamp%%", "%%lampQuery%%"));
console.log(matchesQuery("%%walk%%", "%%nothing%%"));
