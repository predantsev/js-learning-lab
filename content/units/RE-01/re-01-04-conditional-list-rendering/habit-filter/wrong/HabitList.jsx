// The list part uses `matching.length && …`: for no matches it renders a stray 0.
export function HabitList({ habits, status }) {
  const matching = habits.filter((habit) => habit.active === (status === "active"));
  return (
    <div>
      {matching.length === 0 && <p>%%empty%%</p>}
      {matching.length && (
        <ul>
          {matching.map((habit) => <li key={habit.id}>{habit.name}</li>)}
        </ul>
      )}
    </div>
  );
}
