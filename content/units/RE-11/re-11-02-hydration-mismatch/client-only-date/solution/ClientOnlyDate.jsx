import { useEffect, useState } from "react";
import { formatDay } from "./format";

export default function ClientOnlyDate({ iso }) {
  // First render: the same text the server printed. After mount: the reader's format.
  const [label, setLabel] = useState(iso);
  useEffect(() => {
    setLabel(formatDay(iso));
  }, [iso]);
  return <time dateTime={iso}>{label}</time>;
}
