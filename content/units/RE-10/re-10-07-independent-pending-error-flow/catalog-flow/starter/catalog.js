const names = ["%%headphones%%", "%%lamp%%", "%%bicycle%%", "%%book%%", "%%tickets%%", "%%mug%%"];
const prices = [80, 45, 240, 25, null, 18];

// 5,000 synthetic gift ideas: the six wishlist items repeated, each with its own number.
export const catalog = Array.from({ length: 5000 }, (_, i) => ({
  id: `c-${i + 1}`,
  name: `${names[i % names.length]} #${i + 1}`,
  price: prices[i % prices.length],
}));
