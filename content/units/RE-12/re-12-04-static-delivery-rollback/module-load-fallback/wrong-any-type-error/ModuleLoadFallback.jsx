// Treats every TypeError as a missing module: broken code also gets a pointless reload button.
export default function ModuleLoadFallback({ error, onReload }) {
  if (!(error instanceof TypeError)) {
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
