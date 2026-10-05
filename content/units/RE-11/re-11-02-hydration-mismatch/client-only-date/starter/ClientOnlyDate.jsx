import { formatDay } from "./format";

export default function ClientOnlyDate({ iso }) {
  return <time dateTime={iso}>{formatDay(iso)}</time>;
}
