import ClientOnlyDate from "./ClientOnlyDate";

const HABITS = [
  { id: "h-01", name: "%%exercise%%", lastDone: "2026-03-01" },
  { id: "h-02", name: "%%reading%%", lastDone: "2026-02-28" },
];

export default function App() {
  return (
    <main>
      {HABITS.map((habit) => (
        <article key={habit.id}>
          <h2>{habit.name}</h2>
          <p>
            %%lastDone%%: <ClientOnlyDate iso={habit.lastDone} />
          </p>
        </article>
      ))}
    </main>
  );
}
