// The wish form: a controlled form whose draft lives in one typed state object. The domain's
// validateItem decides whether the draft is saved or the messages are shown.
import { useState } from "react";
import type { SubmitEvent } from "react";
import { validateItem } from "../domain/wishes.ts";
import type { Wish, WishErrorKey, WishErrors } from "../domain/wishes.ts";

// What a saved wish consists of, besides its id.
export type WishFields = Omit<Wish, "id">;

// The fields as the form holds them: text exactly as typed, so an empty price stays "".
type Draft = { name: string; price: string; category: string; acquired: boolean };

function draftOf(item: Wish | null): Draft {
  if (item === null) {
    return { name: "", price: "", category: "", acquired: false };
  }
  return { name: item.name, price: item.price === null ? "" : String(item.price), category: item.category ?? "", acquired: item.acquired };
}

// The text the form shows for an error key; no key means no message.
function messageFor(errorKey: WishErrorKey | undefined): string {
  switch (errorKey) {
    case "required":
      return "%%requiredMessage%%";
    case "too-long":
      return "%%tooLongMessage%%";
    case "not-a-number":
      return "%%notNumberMessage%%";
    case "negative":
      return "%%invalidMessage%%";
    case "not-whole":
      return "%%notWholeMessage%%";
    default:
      return "";
  }
}

type ItemFormProps = {
  item: Wish | null; // the wish being edited, or null for a new one
  categories: string[];
  onSave: (fields: WishFields) => void;
  onCancel: () => void;
};

export function ItemForm({ item, categories, onSave, onCancel }: ItemFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(item));
  const [errors, setErrors] = useState<WishErrors>({});

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // An empty price field means "no price", not 0.
    const check = validateItem({ name: draft.name, price: draft.price === "" ? null : Number(draft.price) });
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    const category = draft.category.trim();
    onSave({ name: check.value.name, price: check.value.price, category: category === "" ? null : category, acquired: draft.acquired });
    setDraft(draftOf(null));
    setErrors({});
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="item-name">%%nameLabel%%</label>
        <input id="item-name" name="name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} aria-invalid={errors.name !== undefined} aria-describedby="item-name-error" />
        <p id="item-name-error" className="error">
          {messageFor(errors.name)}
        </p>
      </div>
      <div className="field">
        <label htmlFor="item-price">%%valueLabel%%</label>
        <input id="item-price" name="price" type="number" min="0" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} aria-invalid={errors.price !== undefined} aria-describedby="item-price-error" />
        <p id="item-price-error" className="error">
          {messageFor(errors.price)}
        </p>
      </div>
      <div className="field">
        <label htmlFor="item-category">%%categoryFieldLabel%%</label>
        <input id="item-category" name="category" maxLength={30} list="category-options" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
        <datalist id="category-options">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>
      <div className="field field-check">
        <input id="item-acquired" name="acquired" type="checkbox" checked={draft.acquired} onChange={(event) => setDraft({ ...draft, acquired: event.target.checked })} />
        <label htmlFor="item-acquired">%%acquiredFieldLabel%%</label>
      </div>
      <button type="submit">%%saveLabel%%</button>
      {item !== null && (
        <button type="button" onClick={onCancel}>
          %%cancelEditLabel%%
        </button>
      )}
    </form>
  );
}
