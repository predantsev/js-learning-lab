import { useEffect, useState } from "react";
import { formatDay } from "./format";

export default function ClientOnlyDate({ iso }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return <time dateTime={iso}>{mounted ? formatDay(iso) : iso}</time>;
}
