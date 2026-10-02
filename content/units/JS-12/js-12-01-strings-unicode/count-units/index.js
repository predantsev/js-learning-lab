// The same text can be counted in three ways.
const words = ["Київ", "🐈", "e\u0301", "Кі\u0301т 🐈"];

for (const word of words) {
  console.log(word, "→", "%%units%%", word.length, "·", "%%points%%", [...word].length);
}

// slice(start, end) cuts by code units, so it can split an emoji in half.
const pets = "🐈🐕";
const cut = pets.slice(0, 3);
console.log(cut, "→", "%%units%%", cut.length);
