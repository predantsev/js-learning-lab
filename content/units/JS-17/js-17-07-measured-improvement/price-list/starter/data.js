// WISH_COUNT synthetic wishes built from the wishlist fixtures. Read-only.
export const WISH_COUNT = 5000;

export const CATEGORIES = [
  { id: "tech", name: "%%tech%%" },
  { id: "home", name: "%%home%%" },
  { id: "sport", name: "%%sport%%" },
  { id: "books", name: "%%books%%" },
];

const FIXTURES = [
  { name: "%%headphones%%", price: 80, category: "tech" },
  { name: "%%lamp%%", price: 45, category: "home" },
  { name: "%%bicycle%%", price: 240, category: "sport" },
  { name: "%%book%%", price: 25, category: "books" },
  { name: "%%tickets%%", price: null, category: null },
  { name: "%%mug%%", price: 18, category: "home" },
];

export function makeWishes(count) {
  return Array.from({ length: count }, (_, i) => {
    const fixture = FIXTURES[i % FIXTURES.length];
    const price = fixture.price === null ? null : fixture.price + (i % 50);
    return { ...fixture, id: "w-" + i, name: `${fixture.name} ${i + 1}`, price, acquired: i % 4 === 0 };
  });
}
