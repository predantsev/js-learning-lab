// Shows the right texts, but as plain paragraphs: a screen reader does not announce them.
export default function ModuleLoadFallback({ error, onReload }) {
  const moduleMissing = error instanceof TypeError && error.message.includes("dynamically imported module");
  if (!moduleMissing) return <p>%%somethingWrong%%</p>;
  return (
    <div>
      <p>%%newVersion%%</p>
      <button type="button" onClick={onReload}>
        %%reloadPage%%
      </button>
    </div>
  );
}
