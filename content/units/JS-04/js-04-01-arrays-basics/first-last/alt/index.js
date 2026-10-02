// Another valid approach: one ternary per function.
function firstOrNull(list) {
  return list.length === 0 ? null : list[0];
}

function lastOrNull(list) {
  return list.length === 0 ? null : list[list.length - 1];
}

const prices = [80, 45, 240];
console.log(firstOrNull(prices), lastOrNull(prices));
console.log(firstOrNull([]), lastOrNull([]));
