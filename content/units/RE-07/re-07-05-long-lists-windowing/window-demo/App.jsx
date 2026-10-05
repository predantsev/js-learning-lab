import { useState } from "react";
import { HABITS } from "./habits";

const ROW_HEIGHT = 40; // px, the same for every row
const VIEWPORT_HEIGHT = 400; // px, the visible part of the list
const OVERSCAN = 5; // extra rows above and below the visible ones

function HabitRow({ habit, top }) {
  return (
    <li style={{ position: top === undefined ? "static" : "absolute", top, height: ROW_HEIGHT, width: "100%" }}>
      {habit.name} <button>%%done%% {habit.name}</button>
    </li>
  );
}

function PlainList({ habits }) {
  return (
    <>
      <p>%%rowsInDom%% {habits.length}</p>
      <ul style={{ height: VIEWPORT_HEIGHT, overflowY: "auto", margin: 0, padding: 0, listStyle: "none" }}>
        {habits.map((habit) => (
          <HabitRow key={habit.id} habit={habit} />
        ))}
      </ul>
    </>
  );
}

function WindowedList({ habits }) {
  const [scrollTop, setScrollTop] = useState(0);
  const firstVisible = Math.floor(scrollTop / ROW_HEIGHT);
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT);
  const start = Math.max(0, firstVisible - OVERSCAN);
  const end = Math.min(habits.length, firstVisible + visibleCount + OVERSCAN);

  return (
    <>
      <p>%%rowsInDom%% {end - start}</p>
      <div style={{ height: VIEWPORT_HEIGHT, overflowY: "auto" }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        {/* The list keeps the full height, so the scroll bar is right; only a slice of rows exists. */}
        <ul style={{ position: "relative", height: habits.length * ROW_HEIGHT, margin: 0, padding: 0, listStyle: "none" }}>
          {habits.slice(start, end).map((habit, offset) => (
            <HabitRow key={habit.id} habit={habit} top={(start + offset) * ROW_HEIGHT} />
          ))}
        </ul>
      </div>
    </>
  );
}

export default function HabitPage() {
  const [windowed, setWindowed] = useState(false);

  return (
    <main>
      <label>
        <input type="checkbox" checked={windowed} onChange={(event) => setWindowed(event.target.checked)} /> %%windowing%%
      </label>
      {windowed ? <WindowedList habits={HABITS} /> : <PlainList habits={HABITS} />}
    </main>
  );
}
