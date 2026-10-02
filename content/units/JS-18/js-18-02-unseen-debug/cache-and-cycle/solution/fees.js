// Rental fees in kopiykas.
import { TOOLS } from "./catalog.js";

// The fee for renting a tool for a number of days, in kopiykas.
// TOOLS is read when the function is called, not while the module loads: by then
// catalog.js has finished, whichever module was imported first.
export function feeFor(id, days) {
  const tool = TOOLS.find((item) => item.id === id);
  return tool.dailyFeeMinor * days;
}
