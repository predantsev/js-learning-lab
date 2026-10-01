function categoryLabel(category = "%%none%%") {
  return "%%prefix%%" + category;
}

console.log(categoryLabel("%%home%%"));
console.log(categoryLabel());
console.log(categoryLabel(null));
