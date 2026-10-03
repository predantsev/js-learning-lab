export default function VersionTag({ meta }) {
  return (
    <p>
      <small>
        %%release%% {meta.version} · {meta.commit}
      </small>
    </p>
  );
}
