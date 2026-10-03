const names = ["%%headphones%%", "%%lamp%%", "%%bicycle%%", "%%book%%", "%%tickets%%", "%%mug%%"];

// 3,000 synthetic wishes: the six wishlist items repeated; every third one is already acquired.
export const wishes = Array.from({ length: 3000 }, (_, i) => ({
  id: `w-${i + 1}`,
  name: `${names[i % names.length]} #${i + 1}`,
  acquired: i % 3 === 0,
}));
