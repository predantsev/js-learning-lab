import { TOO_LONG } from "./format.js";

export function validateName(name) {
  if (name.trim() === "") {
    return "empty";
  }
  if (name.length > 80) {
    return TOO_LONG;
  }
  return null;
}
