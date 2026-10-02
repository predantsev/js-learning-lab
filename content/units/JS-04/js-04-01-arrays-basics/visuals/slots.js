const prices = [80, 45, 240];
prices.push(18);
const removed = prices.pop();
console.log(removed, prices.length);
prices[5] = 10;
console.log(prices.length, prices[3]);
