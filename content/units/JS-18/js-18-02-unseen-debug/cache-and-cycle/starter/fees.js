// Rental fees in kopiykas.
import { TOOLS } from "./catalog.js";

// The daily fee of every tool, looked up by id.
const dailyFeeById = new Map(TOOLS.map((tool) => [tool.id, tool.dailyFeeMinor]));

// The fee for renting a tool for a number of days, in kopiykas.
export function feeFor(id, days) {
  return dailyFeeById.get(id) * days;
}
