// Habits with the most completions first. Each row has a note field
// and one chip per completion date.
function byCompletions(a, b) {
  return b.completions.length - a.completions.length;
}

function HabitRow({ habit }) {
  return (
    <li data-habit={habit.id}>
      <span>{habit.name}</span>{" "}
      <span className="days">
        {habit.completions.map((day) => (
          <small key={day}>{day.slice(5)} </small>
        ))}
      </span>
      <input aria-label={`%%noteFor%% ${habit.name}`} />{" "}
      <button type="button" data-id={habit.id}>%%delete%% {habit.name}</button>
    </li>
  );
}

export function HabitBoard({ habits }) {
  const opened = Number(localStorage.getItem("jsll.habits.boardViews") ?? 0);
  localStorage.setItem("jsll.habits.boardViews", String(opened + 1));
  const ranked = habits.toSorted(byCompletions);
  return (
    <ol>
      {ranked.map((habit) => (
        <HabitRow key={habit.id} habit={habit} />
      ))}
    </ol>
  );
}
