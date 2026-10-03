import { useState } from "react";

const WISHES = [
  { id: "w-1", name: "%%lamp%%" },
  { id: "w-2", name: "%%mug%%" },
];

export default function WishForm() {
  const [wishes, setWishes] = useState(WISHES);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const name = draft.trim();
    if (name === "") return;
    setWishes([...wishes, { id: `w-${wishes.length + 1}`, name }]);
    setDraft("");
    setNotice(`%%addedPrefix%% ${name}`);
  }

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <label>
          %%nameLabel%% <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <button type="submit">%%add%%</button>
      </form>
      <p role="status">{notice}</p>
      <ul>
        {wishes.map((wish) => (
          <li key={wish.id}>{wish.name}</li>
        ))}
      </ul>
    </section>
  );
}
