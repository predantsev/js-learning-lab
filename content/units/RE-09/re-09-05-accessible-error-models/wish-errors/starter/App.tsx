import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { START_WISHES, saveWish, server, validateWish } from "./wishes";
import type { Wish } from "./wishes";
import type { AppError } from "./appError";

const MESSAGES = {
  required: "%%nameRequired%%",
  tooLong: "%%nameTooLong%%",
  notWhole: "%%priceNotWhole%%",
};

export default function WishForm() {
  const [wishes, setWishes] = useState<Wish[]>(START_WISHES);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<AppError[]>([]);
  const [failedChecks, setFailedChecks] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (failedChecks > 0) summaryRef.current?.focus();
  }, [failedChecks]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateWish({ name, price });
    const found: AppError[] = [];
    if (!result.ok) {
      if (result.errors.name) found.push({ kind: "field", field: "name", message: MESSAGES[result.errors.name] });
      if (result.errors.price) found.push({ kind: "field", field: "price", message: MESSAGES[result.errors.price] });
    } else if (wishes.some((wish) => wish.name.toLowerCase() === result.value.name.toLowerCase())) {
      found.push({ kind: "form", message: "%%duplicate%%" });
    }
    if (!result.ok || found.length > 0) {
      setErrors(found);
      setFailedChecks((count) => count + 1);
      return;
    }
    try {
      const saved = await saveWish(result.value);
      setWishes((list) => [...list, saved]);
      setErrors([]);
      setName("");
      setPrice("");
    } catch {
      setErrors([{ kind: "request", message: "%%saveFailed%%" }]);
    }
  }

  // TODO: every kind of error goes to its own accessible place (see the task).
  // Right now they are all just red text under the button.
  return (
    <section>
      <form onSubmit={handleSubmit} noValidate>
        <p>
          <label htmlFor="wish-name">%%nameLabel%%</label> <input id="wish-name" value={name} onChange={(event) => setName(event.target.value)} />
        </p>
        <p>
          <label htmlFor="wish-price">%%priceLabel%%</label> <input id="wish-price" inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} />
        </p>
        <p>
          <button type="submit">%%save%%</button>{" "}
          <button type="button" onClick={() => (server.failNext = true)}>
            %%failNext%%
          </button>
        </p>
        <ul>
          {errors.map((error, index) => (
            <li key={index} style={{ color: "firebrick" }}>
              {error.message}
            </li>
          ))}
        </ul>
      </form>
      <ul data-part="wishes">
        {wishes.map((wish) => (
          <li key={wish.id}>{wish.name}</li>
        ))}
      </ul>
    </section>
  );
}
