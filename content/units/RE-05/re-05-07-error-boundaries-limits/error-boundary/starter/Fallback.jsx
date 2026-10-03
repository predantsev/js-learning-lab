// What the detail area shows instead of a screen that failed to render.
export function Fallback({ onReset }) {
  return (
    <div role="alert">
      <p>%%brokenRecord%%</p>
      <button onClick={onReset}>%%tryAgain%%</button>
    </div>
  );
}
