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
  // TODO: keep both fields in one state object of type WishFields

  // TODO: typed change handlers for the fields and a typed submit handler

  return (
    <section>
      <h1>%%title%%</h1>
      <form>
        <label>
          %%nameLabel%% <input />
        </label>
        <p className="name-error">{errors.name ? MESSAGES[errors.name] : ""}</p>
        <label>
          %%priceLabel%% <input inputMode="numeric" />
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
