const habits = [
  { id: "h-01", name: "%%exercise%%" },
  { id: "h-02", name: "%%read%%" },
  { id: "h-03", name: "%%water%%" },
  { id: "h-04", name: "%%tidy%%" },
  { id: "h-06", name: "%%walk%%" },
  { id: "h-02", name: "%%read%%" },
];

let comparisons = 0;

function hasDuplicateIdsNested(list) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      comparisons = comparisons + 1;
      if (list[i].id === list[j].id) {
        return true;
      }
    }
  }
  return false;
}

// Short code, but filter walks the whole list for every record: n × n work again.
function hasDuplicateIdsLookup(list) {
  for (const habit of list) {
    comparisons = comparisons + 1;
    const twins = list.filter((other) => other.id === habit.id);
    if (twins.length > 1) {
      return true;
    }
  }
  return false;
}

comparisons = 0;
console.log(hasDuplicateIdsNested(habits), comparisons);
comparisons = 0;
console.log(hasDuplicateIdsLookup(habits), comparisons);
