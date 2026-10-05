export function Badge({ label }) {
  return <p>%%session%%: «{label}»</p>;
}

// Legacy: default props on a function component.
Badge.defaultProps = { label: "%%focus%%" };
