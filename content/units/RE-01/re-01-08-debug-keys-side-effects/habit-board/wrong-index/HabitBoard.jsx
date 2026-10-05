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
  const ranked = habits.toSorted(byCompletions);
  return (
    <ol>
      {ranked.map((habit, index) => (
        <HabitRow key={index} habit={habit} />
      ))}
    </ol>
  );
}
