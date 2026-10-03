// Shows the history stack and the app's own Back and Forward buttons:
// a sandbox page has no browser toolbar, so the app draws its own.
import { useHistory, useLocation } from "./router";

export function HistoryPanel() {
  const history = useHistory();
  const { entries, index } = useLocation();
  return (
    <aside aria-label="%%historyLabel%%" style={{ borderBottom: "1px solid dimgray", marginBottom: "1rem" }}>
      <button onClick={() => history.back()} disabled={index === 0}>← %%back%%</button>{" "}
      <button onClick={() => history.forward()} disabled={index === entries.length - 1}>%%forward%% →</button>
      <ol>
        {entries.map((entry, i) => (
          <li key={i}>
            <code>{entry}</code>
            {i === index && <strong> ← %%now%%</strong>}
          </li>
        ))}
      </ol>
    </aside>
  );
}
