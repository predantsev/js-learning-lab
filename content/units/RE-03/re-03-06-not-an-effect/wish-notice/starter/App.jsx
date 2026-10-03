import { useEffect, useState } from "react";

const WISHES = [
  { id: "w-1", name: "%%lamp%%" },
  { id: "w-2", name: "%%mug%%" },
];

export default function WishForm() {
  const [wishes, setWishes] = useState(WISHES);
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");

  // Reacts to the "submitted" flag after the render that the submit caused.
  useEffect(() => {
    if (!submitted) return;
    setNotice(`%%addedPrefix%% ${wishes[wishes.length - 1].name}`);
    setSubmitted(false);
  }, [submitted, wishes]);

  function handleSubmit(event) {
    event.preventDefault();
    const name = draft.trim();
    if (name === "") return;
    setWishes([...wishes, { id: `w-${wishes.length + 1}`, name }]);
    setDraft("");
    setSubmitted(true);
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
