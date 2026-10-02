function total(prices) {
  let sum = 0;
  for (let i = 0; i < prices.length; i++) {
    sum = sum + prices[i];
  }
  return sum;
}

console.log(total([]));
console.log(total([45]));
console.log(total([80, 45, 240]));
