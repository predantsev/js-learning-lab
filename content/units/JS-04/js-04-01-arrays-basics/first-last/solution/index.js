// The first element of the list, or null when the list is empty.
function firstOrNull(list) {
  if (list.length === 0) {
    return null;
  }
  return list[0];
}

// The last element of the list, or null when the list is empty.
function lastOrNull(list) {
  if (list.length === 0) {
    return null;
  }
  return list[list.length - 1];
}

const prices = [80, 45, 240];
console.log(firstOrNull(prices), lastOrNull(prices));
console.log(firstOrNull([]), lastOrNull([]));
