// 1000 synthetic expenses and 100 ids to look up.
const records = [];
for (let i = 1; i <= 1000; i++) {
  records.push({ id: "e-" + i, amountMinor: i * 10 });
}
const wanted = [];
for (let i = 1; i <= 100; i++) {
  wanted.push("e-" + i * 10);
}

// 100 lookups with find: each one walks the list from the start.
let comparisons = 0;
for (const id of wanted) {
  records.find((record) => {
    comparisons = comparisons + 1;
    return record.id === id;
  });
}
console.log("%%withFind%%", comparisons);
