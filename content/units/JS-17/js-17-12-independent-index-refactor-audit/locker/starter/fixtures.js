// Synthetic parcels. Read-only.
export const FIXTURES = [
  { code: "P-1001", recipient: "%%r1%%" },
  { code: "P-1002", recipient: "%%r2%%" },
  { code: "P-1003", recipient: "%%r3%%" },
  { code: "P-1004", recipient: "%%r4%%" },
];

// `count` more synthetic parcels with codes that no fixture has.
export function makeParcels(count, from = 2000) {
  return Array.from({ length: count }, (_, i) => ({ code: "P-" + (from + i), recipient: "%%recipient%% " + (i + 1) }));
}
