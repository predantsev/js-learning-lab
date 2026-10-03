import { wishes } from "./wishes";

console.log("%%moduleArrived%%");

export default function StatsPanel() {
  const wanted = wishes.filter((wish) => !wish.acquired);
  const total = wanted.filter((wish) => wish.price !== null).reduce((sum, wish) => sum + wish.price, 0);
  const unpriced = wanted.filter((wish) => wish.price === null).length;
  return (
    <section>
      <h2>%%totals%%</h2>
      <p>%%wantedTotal%%: {total}</p>
      <p>%%unpriced%%: {unpriced}</p>
    </section>
  );
}
