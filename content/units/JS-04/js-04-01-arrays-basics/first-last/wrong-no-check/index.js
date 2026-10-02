// No empty check: for [] both functions return undefined instead of null.
function firstOrNull(list) {
  return list[0];
}

function lastOrNull(list) {
  return list[list.length - 1];
}

const prices = [80, 45, 240];
console.log(firstOrNull(prices), lastOrNull(prices));
console.log(firstOrNull([]), lastOrNull([]));
