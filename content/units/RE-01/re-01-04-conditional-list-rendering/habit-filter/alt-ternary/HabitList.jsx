export function HabitList({ habits, status }) {
  const items = habits
    .filter((habit) => habit.active === (status === "active"))
    .map((habit) => <li key={habit.id}>{habit.name}</li>);
  return items.length > 0 ? <ul>{items}</ul> : <p>%%empty%%</p>;
}
