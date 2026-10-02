// Yield the records in pages: arrays of at most `size` records.
// Read the records lazily: build a page only when it is asked for.
function* paginate(records, size) {
  let page = [];
  for (const record of records) {
    page.push(record);
    if (page.length === size) {
      yield page;
      page = [];
    }
  }
  if (page.length > 0) {
    yield page;
  }
}

const habits = ["%%exercise%%", "%%read%%", "%%water%%", "%%tidy%%", "%%words%%", "%%walk%%", "%%stretch%%"];
const sizes = [];
for (const page of paginate(habits, 3)) {
  sizes.push(page.length);
}
console.log(sizes.join());
