// 2,000 synthetic wishes built from six base names.
const BASE = [
  { name: "%%headphones%%", price: 80 },
  { name: "%%lamp%%", price: 45 },
  { name: "%%bicycle%%", price: 240 },
  { name: "%%book%%", price: 25 },
  { name: "%%tickets%%", price: 60 },
  { name: "%%mug%%", price: 18 },
];

export const WISHES = Array.from({ length: 2000 }, (_, index) => {
  const base = BASE[index % BASE.length];
  return { id: `w-${index + 1}`, name: `${base.name} ${index + 1}`, price: base.price + (index % 7) * 5 };
});
