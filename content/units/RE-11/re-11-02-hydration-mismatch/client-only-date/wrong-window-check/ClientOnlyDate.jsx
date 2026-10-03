import { formatDay } from "./format";

// "On the server there is no window, so the server prints iso and the browser formats" —
// but the browser's first render is the hydration render, and it must match the server.
export default function ClientOnlyDate({ iso }) {
  const label = typeof window !== "undefined" ? formatDay(iso) : iso;
  return <time dateTime={iso}>{label}</time>;
}
