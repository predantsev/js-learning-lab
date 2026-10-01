const addFee = (price) => price + 10;

function applyTwice(fn, value) {
  const once = fn(value);
  const twice = fn(once);
  return twice;
}

console.log(applyTwice(addFee, 100));
