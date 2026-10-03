import { useEffect, useRef, useState } from "react";

const WISHES = [
  { id: "w-01", name: "%%headphones%%" },
  { id: "w-02", name: "%%lamp%%" },
  { id: "w-03", name: "%%bicycle%%" },
  { id: "w-06", name: "%%mug%%" },
];

// Describes an element in a few words, for the console.
function describe(element) {
  return element === document.body ? "body" : `${element.tagName.toLowerCase()} “${element.textContent}”`;
}

export default function WishList() {
  const [wishes, setWishes] = useState(WISHES);

  function remove(id) {
    setWishes(wishes.filter((wish) => wish.id !== id));
  }

  // After every commit with a new list: where is the keyboard focus now?
  useEffect(() => {
    console.log(`%%focusOn%% ${describe(document.activeElement)}`);
  }, [wishes]);

  return (
    <section>
      <h2 tabIndex={-1}>%%heading%%</h2>
      <ul>
        {wishes.map((wish) => (
          <li key={wish.id}>
            {wish.name}{" "}
            <button onClick={() => remove(wish.id)}>
              %%remove%% {wish.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
