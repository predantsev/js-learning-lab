console.log("domain/wish.ts %%loaded%%");

export interface Wish {
  readonly id: string;
  name: string;
  price: number | null;
}

export function validateItem(name: string): boolean {
  return name.trim() !== "";
}
