const ids = ["w-01", "w-02", "w-03", "w-04", "w-05", "w-06", "w-07", "w-08"];

// Nested loops: compare every pair once.
let nestedOps = 0;
function hasDuplicateNested(list) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      nestedOps = nestedOps + 1;
      if (list[i] === list[j]) {
        return true;
      }
    }
  }
  return false;
}

// One pass with a Set of the ids seen so far.
let setOps = 0;
function hasDuplicateWithSet(list) {
  const seen = new Set();
  for (const id of list) {
    setOps = setOps + 1;
    if (seen.has(id)) {
      return true;
    }
    seen.add(id);
  }
  return false;
}

hasDuplicateNested(ids);
hasDuplicateWithSet(ids);
console.log(nestedOps, setOps);
