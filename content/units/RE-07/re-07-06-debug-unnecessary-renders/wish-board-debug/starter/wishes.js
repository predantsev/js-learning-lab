// 2,000 synthetic wishes built from six base names. Prices are whole hryvnias.
const NAMES = ["%%headphones%%", "%%lamp%%", "%%bicycle%%", "%%book%%", "%%tickets%%", "%%mug%%"];

export const WISHES = Array.from({ length: 2000 }, (_, index) => ({
  id: `w-${index + 1}`,
  name: `${NAMES[index % NAMES.length]} ${index + 1}`,
  price: 2000 - index,
}));
