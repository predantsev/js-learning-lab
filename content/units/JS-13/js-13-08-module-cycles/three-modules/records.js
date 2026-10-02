import { validateName } from "./validate.js";

export const MAX_NAME = 80;

export function addRecord(list, name) {
  const problem = validateName(name);
  if (problem !== null) {
    throw new RangeError(problem);
  }
  return [...list, { id: "w-" + (list.length + 1), name }];
}
