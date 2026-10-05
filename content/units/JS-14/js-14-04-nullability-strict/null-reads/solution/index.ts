type Wish = { name: string; price: number | null; category: string | null };
type Task = { title: string; dueDate: string | null };

function priceText(wish: Wish): string {
  if (wish.price === null) {
    return "%%noPrice%%";
  }
  return `${wish.price.toFixed(2)} %%currency%%`;
}

function dueMonth(task: Task): string {
  return task.dueDate?.slice(0, 7) ?? "%%noDate%%";
}

function categoryLabel(wish: Wish): string {
  return wish.category?.toUpperCase() ?? "%%noCategory%%";
}

const tickets: Wish = { name: "%%tickets%%", price: null, category: null };
const letter: Task = { title: "%%grandma%%", dueDate: null };

console.log(priceText(tickets));
console.log(dueMonth(letter));
console.log(categoryLabel(tickets));
