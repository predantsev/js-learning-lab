import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { validateItem, MESSAGES, nextWishId } from "./wishes";
import type { Wish, WishErrors } from "./wishes";

// The form's fields as the inputs hold them: always text.
type WishFields = { name: string; price: string };

const EMPTY_FIELDS: WishFields = { name: "", price: "" };

export default function WishForm() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [errors, setErrors] = useState<WishErrors>({});
  const [draft, setDraft] = useState<WishFields>(EMPTY_FIELDS);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft({ ...draft, [event.target.name]: event.target.value });
  }

  function toPrice(text: string): number | null {
    if (text.trim() === "") {
      return null;
    }
    return Number(text);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = validateItem({ name: draft.name, price: toPrice(draft.price) });
    if (check.ok) {
      setWishes([...wishes, { id: nextWishId(), acquired: false, category: null, ...check.value }]);
      setDraft(EMPTY_FIELDS);
      setErrors({});
    } else {
      setErrors(check.errors);
    }
  }

  return (
    <section>
      <h1>%%title%%</h1>
      <form onSubmit={handleSubmit}>
        <label>
          %%nameLabel%% <input name="name" value={draft.name} onChange={handleChange} />
        </label>
        <p className="name-error">{errors.name ? MESSAGES[errors.name] : ""}</p>
        <label>
          %%priceLabel%% <input name="price" inputMode="numeric" value={draft.price} onChange={handleChange} />
        </label>
        <p className="price-error">{errors.price ? MESSAGES[errors.price] : ""}</p>
        <button>%%add%%</button>
      </form>
      <ul>
        {wishes.map((wish) => (
          <li key={wish.id}>
            {wish.name} — {wish.price === null ? "%%noPrice%%" : `${wish.price} %%currency%%`}
          </li>
        ))}
      </ul>
    </section>
  );
}
