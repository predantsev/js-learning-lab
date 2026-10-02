// Counting from 1: reads the second element and one slot past the end.
function firstOrNull(list) {
  if (list.length === 0) {
    return null;
  }
  return list[1];
}

function lastOrNull(list) {
  if (list.length === 0) {
    return null;
  }
  return list[list.length];
}

const prices = [80, 45, 240];
console.log(firstOrNull(prices), lastOrNull(prices));
console.log(firstOrNull([]), lastOrNull([]));
