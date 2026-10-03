import { useEffect } from "react";

const LABELS = { week: "%%week%%", month: "%%month%%", year: "%%year%%" };
let rebuilds = 0;

export function PeriodPicker({ periods, value, onChange }) {
  // In a real app this step is expensive: it rebuilds keyboard shortcuts for the periods.
  // It must run again only when the list of periods is really a different list.
  useEffect(() => {
    rebuilds += 1;
    console.log(`%%rebuilt%% ${periods.length}`);
  }, [periods]);

  return (
    <p>
      {periods.map((period) => (
        <button key={period} aria-pressed={value === period} onClick={() => onChange(period)}>
          {LABELS[period]}
        </button>
      ))}
    </p>
  );
}

export function pickerRebuilds() {
  return rebuilds;
}
