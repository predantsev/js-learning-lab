type SelectListProps<T> = {
  label: string;
  items: readonly T[];
  selected: T;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  onSelect: (key: string) => void;
};

export function SelectList<T>({ label, items, selected, getKey, getLabel, onSelect }: SelectListProps<T>) {
  const selectedKey = getKey(selected);
  return (
    <div role="group" aria-label={label}>
      {items.map((item) => (
        <button key={getKey(item)} type="button" aria-pressed={getKey(item) === selectedKey} onClick={() => onSelect(getKey(item))}>
          {getLabel(item)}
        </button>
      ))}
    </div>
  );
}
