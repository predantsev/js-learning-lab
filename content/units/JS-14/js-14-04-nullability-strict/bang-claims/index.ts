type Wish = { name: string; category: string | null };

function categoryLength(wish: Wish): number {
  // "!" tells tsc: trust me, category is not null here.
  return wish.category!.length;
}

const lamp: Wish = { name: "%%lamp%%", category: "%%home%%" };
const tickets: Wish = { name: "%%tickets%%", category: null };

console.log(categoryLength(lamp));
console.log(categoryLength(tickets));
