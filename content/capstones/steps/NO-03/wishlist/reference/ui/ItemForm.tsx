// The wish form: a controlled form whose draft lives in one typed state object. The domain's
// validateItem decides whether the draft is saved or the messages are shown. While the draft differs
// from what it started with, leaving it asks first: inside the app through the router's guard, and on
// a reload or a tab close through the browser's beforeunload question.
import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { validateItem } from "../domain/wishes.ts";
import type { Wish, WishErrorKey, WishErrors } from "../domain/wishes.ts";
import type { WishFields } from "./itemsReducer.ts";
import { useBlocker } from "./router.tsx";

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
  onSave: (fields: WishFields) => Promise<boolean>; // resolves to true once the API has saved it
  onCancel?: () => void; // shown as a button when given
};

export function ItemForm({ item, categories, onSave, onCancel }: ItemFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(item));
  const [errors, setErrors] = useState<WishErrors>({});
  // Counts failed saves: the focus effect runs after each of them, also when the errors are the same.
  const [failedSubmits, setFailedSubmits] = useState(0);
  // True while the API is saving: the Save button is disabled, so one click sends one request.
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  // Unsaved edits: the draft differs from the one the form started with.
  const start = draftOf(item);
  const isDirty = draft.name !== start.name || draft.price !== start.price || draft.category !== start.category || draft.acquired !== start.acquired;
  const blocker = useBlocker(isDirty);

  // The beforeunload listener is an external system: it exists only while there are unsaved edits,
  // and the cleanup removes the same function.
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // After a failed save focus moves to the first field with an error, which reads its message out.
  // The field to focus is computed in handleSubmit, so the effect reads only refs and the counter.
  const firstInvalid = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (failedSubmits > 0) {
      firstInvalid.current?.focus();
    }
  }, [failedSubmits]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // An empty price field means "no price", not 0.
    const check = validateItem({ name: draft.name, price: draft.price === "" ? null : Number(draft.price) });
    if (!check.ok) {
      setErrors(check.errors);
      firstInvalid.current = check.errors.name !== undefined ? nameRef.current : priceRef.current;
      setFailedSubmits(failedSubmits + 1);
      return;
    }
    const category = draft.category.trim();
    setSaving(true);
    const saved = await onSave({ name: check.value.name, price: check.value.price, category: category === "" ? null : category, acquired: draft.acquired });
    setSaving(false);
    // A failed save keeps the draft, so nothing typed is lost.
    if (saved) {
      setDraft(draftOf(null));
      setErrors({});
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="item-name">%%nameLabel%%</label>
        <input
          id="item-name"
          name="name"
          ref={nameRef}
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          aria-invalid={errors.name !== undefined}
          aria-describedby={errors.name !== undefined ? "item-name-error" : undefined}
        />
        {errors.name !== undefined && (
          <p id="item-name-error" className="error">
            {messageFor(errors.name)}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="item-price">%%valueLabel%%</label>
        <input
          id="item-price"
          name="price"
          type="number"
          min="0"
          ref={priceRef}
          value={draft.price}
          onChange={(event) => setDraft({ ...draft, price: event.target.value })}
          aria-invalid={errors.price !== undefined}
          aria-describedby={errors.price !== undefined ? "item-price-error" : undefined}
        />
        {errors.price !== undefined && (
          <p id="item-price-error" className="error">
            {messageFor(errors.price)}
          </p>
        )}
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
      <button type="submit" disabled={saving}>
        %%saveLabel%%
      </button>
      {onCancel !== undefined && (
        <button type="button" onClick={onCancel}>
          %%cancelEditLabel%%
        </button>
      )}
      {blocker.blocked && <LeaveDialog onStay={blocker.stay} onLeave={blocker.proceed} />}
    </form>
  );
}

// The in-page question while a navigation waits: Stay gets focus, and after the question closes focus
// goes back to the element that had it.
function LeaveDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const stayRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement;
    stayRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement) {
        opener.focus();
      }
    };
  }, []);
  return (
    <div role="alertdialog" aria-labelledby="leave-text">
      <p id="leave-text">%%unsavedQuestion%%</p>
      <button type="button" ref={stayRef} onClick={onStay}>
        %%stayLabel%%
      </button>
      <button type="button" onClick={onLeave}>
        %%leaveLabel%%
      </button>
    </div>
  );
}
