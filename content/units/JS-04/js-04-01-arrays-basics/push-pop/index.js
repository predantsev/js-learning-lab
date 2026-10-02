// Prices from a wish list. Slots are numbered from 0.
const prices = [80, 45, 240];
console.log("prices[0]:", prices[0]);
console.log("prices.length:", prices.length);

prices.push(18); // adds a slot at the end
console.log("push(18) → length:", prices.length);

const removed = prices.pop(); // takes the last slot off
console.log("pop() →", removed, "| length:", prices.length);

const empty = [];
console.log("empty.length:", empty.length);
console.log("empty[0]:", empty[0]);
console.log("empty.pop():", empty.pop());
