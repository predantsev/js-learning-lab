// A module-level array: it lives outside the component and outlives every render.
const wanted = [];

export function WantedLine({ wishes }) {
  console.log("render WantedLine");
  for (const wish of wishes) {
    if (!wish.acquired) wanted.push(wish.name);
  }
  return <p>%%want%%: {wanted.join(", ")}</p>;
}
