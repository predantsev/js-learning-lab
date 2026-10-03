type SelectListProps<T> = {
  label: string;
  items: readonly T[];
  selected: T;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
};

export function SelectList<T>({ label, items, selected, getKey, getLabel, onSelect }: SelectListProps<T>) {
  return (
    <div role="group" aria-label={label}>
      {items.map((item) => (
        <button key={getKey(item)} type="button" aria-pressed={item === selected} onClick={() => onSelect(item)}>
          {getLabel(item)}
        </button>
      ))}
    </div>
  );
}
