// The tools the library lends. Prices are in kopiykas.
export const TOOLS = [
  { id: "drill", name: "%%drill%%", units: 2, dailyFeeMinor: 4000 },
  { id: "ladder", name: "%%ladder%%", units: 1, dailyFeeMinor: 2500 },
  { id: "washer", name: "%%washer%%", units: 2, dailyFeeMinor: 9000 },
  { id: "sewing", name: "%%sewing%%", units: 3, dailyFeeMinor: 3500 },
];

// "Drill — 40.00 UAH per day": the name and the fee for one day.
// The fee comes from the tool itself, so this module no longer imports fees.js: no cycle.
export function describeTool(id) {
  const tool = TOOLS.find((item) => item.id === id);
  return `${tool.name} — ${(tool.dailyFeeMinor / 100).toFixed(2)} %%perDay%%`;
}
