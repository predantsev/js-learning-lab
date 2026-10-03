// status is "active" or "paused".
// Show only the habits with that status, one <li> per habit;
// when none match, show the empty-state paragraph instead of a list.
export function HabitList({ habits, status }) {
  const wantActive = status === "active";
  const matching = habits.filter((habit) => habit.active === wantActive);
  if (matching.length === 0) {
    return <p>%%empty%%</p>;
  }
  return (
    <ul>
      {matching.map((habit) => (
        <li key={habit.id}>{habit.name}</li>
      ))}
    </ul>
  );
}
