// The empty state is there, but every habit is shown whatever the status.
export function HabitList({ habits, status }) {
  if (habits.length === 0) {
    return <p>%%empty%%</p>;
  }
  return (
    <ul>
      {habits.map((habit) => <li key={habit.id}>{habit.name}</li>)}
    </ul>
  );
}
