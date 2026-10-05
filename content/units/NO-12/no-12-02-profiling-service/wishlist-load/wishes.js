// 5,000 synthetic wishes, built from the six course fixtures.
const names = ['%%headphones%%', '%%lamp%%', '%%bicycle%%', '%%book%%', '%%tickets%%', '%%mug%%'];

export function makeWishes(count) {
  const wishes = [];
  for (let i = 1; i <= count; i++) {
    const name = names[(i * 7) % names.length];
    wishes.push({ id: `w-${i}`, name: `${name} ${(i * 7919) % count}`, price: 10 + (i % 240), acquired: i % 5 === 0 });
  }
  return wishes;
}
