import { formatLabel } from './domain/format.js';

// A React DOM card. Rewrite it with React Native components;
// keep the formatLabel call exactly as it is.
export function TaskCard({ task, labels, onToggle }) {
  return (
    <div className="card">
      <h2>{formatLabel(task, labels)}</h2>
      <button onClick={onToggle}>{labels.toggle}</button>
    </div>
  );
}
