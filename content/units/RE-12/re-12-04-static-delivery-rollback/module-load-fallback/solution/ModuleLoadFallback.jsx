// Rendered by ErrorBoundary when something inside it throws.
// error: what was thrown; onReload: call it to load the page again.
export default function ModuleLoadFallback({ error, onReload }) {
  const moduleMissing = error instanceof TypeError && error.message.includes("dynamically imported module");
  if (!moduleMissing) {
    return (
      <div role="alert">
        <p>%%somethingWrong%%</p>
      </div>
    );
  }
  return (
    <div role="alert">
      <p>%%newVersion%%</p>
      <button type="button" onClick={onReload}>
        %%reloadPage%%
      </button>
    </div>
  );
}
