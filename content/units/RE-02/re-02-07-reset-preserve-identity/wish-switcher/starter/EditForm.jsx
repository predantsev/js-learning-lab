import { useState } from "react";

// An edit form with its own draft. Read-only.
// The draft starts from the wish only when this EditForm appears.
export default function EditForm({ wish }) {
  const [draft, setDraft] = useState({ name: wish.name, price: String(wish.price) });

  return (
    <form className="edit" onSubmit={(event) => event.preventDefault()}>
      <h2>%%editing%%: {wish.name}</h2>
      <label>
        %%nameLabel%% <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </label>
      <label>
        %%priceLabel%% <input inputMode="numeric" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} />
      </label>
    </form>
  );
}
