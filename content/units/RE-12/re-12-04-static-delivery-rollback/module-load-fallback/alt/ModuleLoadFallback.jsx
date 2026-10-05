// Rendered by ErrorBoundary when something inside it throws.
// error: what was thrown; onReload: call it to load the page again.
export default function ModuleLoadFallback({ error, onReload }) {
  const isModuleLoad = error?.name === "TypeError" && /dynamically imported module/.test(error.message);
  return (
    <div role="alert">
      <p>{isModuleLoad ? "%%newVersion%%" : "%%somethingWrong%%"}</p>
      {isModuleLoad && (
        <button type="button" onClick={() => onReload()}>
          %%reloadPage%%
        </button>
      )}
    </div>
  );
}
