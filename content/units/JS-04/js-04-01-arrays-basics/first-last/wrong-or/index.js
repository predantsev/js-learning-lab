// || treats 0 and "" as missing, so a real 0 becomes null.
function firstOrNull(list) {
  return list[0] || null;
}

function lastOrNull(list) {
  return list[list.length - 1] || null;
}

const prices = [80, 45, 240];
console.log(firstOrNull(prices), lastOrNull(prices));
console.log(firstOrNull([]), lastOrNull([]));
