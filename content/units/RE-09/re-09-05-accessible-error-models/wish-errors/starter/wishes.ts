// The wish domain and a fixture server. Read-only.
export type Wish = { readonly id: string; name: string; price: number | null };

export type WishErrors = { name?: "required" | "tooLong"; price?: "notWhole" };

export function validateWish(draft: { name: string; price: string }):
  | { ok: true; value: { name: string; price: number | null } }
  | { ok: false; errors: WishErrors } {
  const errors: WishErrors = {};
  const name = draft.name.trim();
  if (name === "") errors.name = "required";
  else if (name.length > 80) errors.name = "tooLong";
  const text = draft.price.trim();
  const price = text === "" ? null : Number(text);
  if (price !== null && !(Number.isInteger(price) && price >= 0)) errors.price = "notWhole";
  if (errors.name !== undefined || errors.price !== undefined) return { ok: false, errors };
  return { ok: true, value: { name, price } };
}

export const START_WISHES: Wish[] = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-02", name: "%%lamp%%", price: 45 },
];

// The server rejects the next save when `server.failNext` is true.
export const server = { failNext: false };
let nextNumber = 7;

export function saveWish(value: { name: string; price: number | null }): Promise<Wish> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (server.failNext) {
        server.failNext = false;
        reject(new Error("503 Service Unavailable"));
        return;
      }
      resolve({ id: `w-${String(nextNumber++).padStart(2, "0")}`, ...value });
    }, 30),
  );
}
