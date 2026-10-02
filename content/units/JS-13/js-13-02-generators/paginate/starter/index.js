// Yield the records in pages: arrays of at most `size` records.
// Read the records lazily: build a page only when it is asked for.
function* paginate(records, size) {
}

const habits = ["%%exercise%%", "%%read%%", "%%water%%", "%%tidy%%", "%%words%%", "%%walk%%", "%%stretch%%"];
const sizes = [];
for (const page of paginate(habits, 3)) {
  sizes.push(page.length);
}
console.log(sizes.join());
