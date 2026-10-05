export type Wish = {
  readonly id: string;
  name: string;
  price: number | null;
  acquired: boolean;
  category: string | null;
};

export const WISHES: Wish[] = [
  { id: "w-01", name: "%%headphones%%", price: 80, acquired: false, category: "%%tech%%" },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false, category: "%%home%%" },
  { id: "w-04", name: "%%book%%", price: 25, acquired: true, category: "%%books%%" },
  { id: "w-05", name: "%%tickets%%", price: null, acquired: false, category: null },
  { id: "w-06", name: "%%mug%%", price: 18, acquired: true, category: "%%home%%" },
];
