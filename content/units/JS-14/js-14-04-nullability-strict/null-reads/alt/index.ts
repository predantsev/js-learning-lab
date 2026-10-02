type Wish = { name: string; price: number | null; category: string | null };
type Task = { title: string; dueDate: string | null };

function priceText(wish: Wish): string {
  const { price } = wish;
  return price !== null ? `${price.toFixed(2)} %%currency%%` : "%%noPrice%%";
}

function dueMonth(task: Task): string {
  if (task.dueDate === null) {
    return "%%noDate%%";
  }
  return task.dueDate.slice(0, 7);
}

function categoryLabel(wish: Wish): string {
  if (typeof wish.category === "string") {
    return wish.category.toUpperCase();
  }
  return "%%noCategory%%";
}

const tickets: Wish = { name: "%%tickets%%", price: null, category: null };
const letter: Task = { title: "%%grandma%%", dueDate: null };

console.log(priceText(tickets));
console.log(dueMonth(letter));
console.log(categoryLabel(tickets));
