// The wish form as text, and what the shared rules say about it. Nothing here imports React Native,
// so Node.js runs its tests (tests/draft.test.js) just as it runs the domain tests.
import { validateItem } from "../domain/wishes.ts";
import type { ValidationResult, Wish, WishErrorKey } from "../domain/wishes.ts";

// The fields as the form holds them: text exactly as typed, so an empty price stays "".
export type Draft = { name: string; price: string; category: string };

export function draftOf(item: Wish | null): Draft {
  if (item === null) {
    return { name: "", price: "", category: "" };
  }
  return { name: item.name, price: item.price === null ? "" : String(item.price), category: item.category ?? "" };
}

// An empty price means "no price"; any other text goes to validateItem as a number, so "12.5",
// "-1" and "abc" get the same error keys as in the web form.
export function checkDraft(draft: Draft): ValidationResult {
  return validateItem({ name: draft.name, price: draft.price === "" ? null : Number(draft.price) });
}

// The text the form shows for an error key; no key means no message.
export function messageFor(errorKey: WishErrorKey | undefined): string {
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
