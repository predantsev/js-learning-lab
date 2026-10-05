export function HabitList({ habits, status }) {
  const matching = habits.filter((habit) => (status === "active" ? habit.active : !habit.active));
  return (
    <>
      {matching.length === 0 && <p>%%empty%%</p>}
      {matching.length > 0 && (
        <ul>
          {matching.map((habit) => <li key={habit.id}>{habit.name}</li>)}
        </ul>
      )}
    </>
  );
}
