interface Wish {
  readonly id: string;
  name: string;
  price: number | null;
}

type GiftIdea = {
  readonly id: string;
  name: string;
  price: number | null;
};

function describeWish(wish: Wish): string {
  return `${wish.id}: ${wish.name}`;
}

const idea: GiftIdea = { id: "g-01", name: "%%bike%%", price: 240 };

console.log(describeWish(idea));
console.log(idea instanceof Wish);
