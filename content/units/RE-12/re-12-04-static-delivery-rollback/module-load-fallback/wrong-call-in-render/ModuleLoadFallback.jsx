// Calls onReload while rendering instead of passing it to the button.
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
      <button type="button" onClick={onReload()}>
        %%reloadPage%%
      </button>
    </div>
  );
}
