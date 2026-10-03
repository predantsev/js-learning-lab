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

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft({ ...draft, name: event.target.value });
  }

  function handlePriceChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft({ ...draft, price: event.target.value });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceText = draft.price.trim();
    const check = validateItem({ name: draft.name, price: priceText === "" ? null : Number(priceText) });
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    const wish: Wish = { id: nextWishId(), name: check.value.name, price: check.value.price, acquired: false, category: null };
    setWishes([...wishes, wish]);
    setDraft(EMPTY_FIELDS);
    setErrors({});
  }

  return (
    <section>
      <h1>%%title%%</h1>
      <form onSubmit={handleSubmit}>
        <label>
          %%nameLabel%% <input value={draft.name} />
        </label>
        <p className="name-error">{errors.name ? MESSAGES[errors.name] : ""}</p>
        <label>
          %%priceLabel%% <input inputMode="numeric" value={draft.price} />
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
