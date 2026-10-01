const prices = [80, 45, 240];

const total = prices.reduce((sum, price) => sum + price, 0);
console.log(total);

const highest = prices.reduce((max, price) => (price > max ? price : max), 0);
console.log(highest);
