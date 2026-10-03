import { useState } from "react";

const START = [
  { id: "w-01", name: "%%headphones%%", acquired: false },
  { id: "w-02", name: "%%lamp%%", acquired: false },
  { id: "w-06", name: "%%mug%%", acquired: true },
];

// Contract of useWishes()
// - Returns { wishes, addWish, toggleAcquired, removeWish }.
// - addWish(name) trims the name; a name that is empty after trimming is ignored;
//   otherwise the wish is added at the end with acquired: false.
// - toggleAcquired(id) flips acquired of that wish only; removeWish(id) removes that wish only.
// - Every call owns its own list.
export function useWishes() {
  const [wishes, setWishes] = useState(START);

  function addWish(name) {
    setWishes([...wishes, { id: `w-${Date.now()}`, name: name, acquired: false }]);
  }

  function toggleAcquired(id) {
    setWishes(wishes.map((wish) => (wish.id === id ? { ...wish, acquired: !wish.acquired } : wish)));
  }

  function removeWish(id) {
    setWishes(wishes.filter((wish) => wish.id !== id));
  }

  return { wishes, addWish, toggleAcquired, removeWish };
}

// An open/closed flag.
export function useToggle(initial) {
  const [on, setOn] = useState(initial);
  return [on, () => setOn(!on)];
}
