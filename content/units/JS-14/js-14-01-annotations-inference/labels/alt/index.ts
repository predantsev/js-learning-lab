// Values from a form always arrive as text.
const form = { title: "  %%lamp%% ", price: "0", note: "  " };

function formatTitle(title: string): string {
  return title.trim();
}

function formatPrice(price: number): string {
  if (price === 0) {
    return "%%free%%";
  }
  return `${price} %%currency%%`;
}

function isEmpty(text: string): boolean {
  return text.trim() === "";
}

const price = Number.parseInt(form.price, 10);

console.log(formatTitle(form.title));
console.log(formatPrice(price));
console.log(isEmpty(form.note));
