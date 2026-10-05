// Filtered correctly, but an empty result leaves an empty <ul> and no message.
export function HabitList({ habits, status }) {
  const matching = habits.filter((habit) => habit.active === (status === "active"));
  return (
    <ul>
      {matching.map((habit) => <li key={habit.id}>{habit.name}</li>)}
    </ul>
  );
}
