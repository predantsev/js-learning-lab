// status is "active" or "paused".
// Show only the habits with that status, one <li> per habit;
// when none match, show the empty-state paragraph instead of a list.
export function HabitList({ habits, status }) {
  return (
    <ul>
      {habits.map((habit) => (
        <li key={habit.id}>{habit.name}</li>
      ))}
    </ul>
  );
}
