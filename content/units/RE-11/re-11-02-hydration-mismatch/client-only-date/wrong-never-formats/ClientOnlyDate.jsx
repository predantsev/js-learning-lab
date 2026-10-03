// Hydrates cleanly, but the reader never gets their own date format.
export default function ClientOnlyDate({ iso }) {
  return <time dateTime={iso}>{iso}</time>;
}
